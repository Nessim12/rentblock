
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("RentBlock Smart Contracts", function () {

  // Helper: deploy all three smart contracts.
  async function deployRentBlock() {
    const [owner, landlord, tenant, arbitrator, outsider] =
      await ethers.getSigners();

    // Deploy the test stablecoin.
    const token = await ethers.deployContract("MockUSDC");

    // Deploy the property registry.
    const registry = await ethers.deployContract("PropertyRegistry");

    // Deploy the rental agreement.
    const rental = await ethers.deployContract("RentalAgreement", [
      token.target,
      registry.target,
      arbitrator.address
    ]);

    return {
      owner,
      landlord,
      tenant,
      arbitrator,
      outsider,
      token,
      registry,
      rental
    };
  }

  // Helper: advance blockchain time and mine a new block.
  async function advanceTime(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  // Helper: create a property and its rental agreement.
  async function createPropertyAndRental() {
    const context = await deployRentBlock();

    const monthlyRent = ethers.parseUnits("500", 6);
    const deposit = ethers.parseUnits("1000", 6);

    // Register a property as the landlord.
    await context.registry.connect(context.landlord).registerProperty(
      "Modern Apartment",
      "Tunis",
      monthlyRent
    );

    // Set the rental start time one hour in the future.
    const latestBlock = await ethers.provider.getBlock("latest");
    const startTime = BigInt(latestBlock!.timestamp + 3600);

    // Create the rental agreement.
    await context.rental.connect(context.landlord).createRentalAgreement(
      1,
      context.tenant.address,
      deposit,
      2,
      startTime
    );

    return {
      ...context,
      monthlyRent,
      deposit,
      startTime
    };
  }

  // TEST 1: Token deployment.
  it("Should deploy MockUSDC with the correct name and decimals", async function () {
    const { token } = await deployRentBlock();

    expect(await token.name()).to.equal("Mock USD Coin");
    expect(await token.symbol()).to.equal("mUSDC");
    expect(await token.decimals()).to.equal(6);
  });

  // TEST 2: Property registration.
  it("Should register a property with the correct owner and information", async function () {
    const { registry, landlord } = await deployRentBlock();

    const monthlyRent = ethers.parseUnits("500", 6);

    await registry.connect(landlord).registerProperty(
      "Modern Apartment",
      "Tunis",
      monthlyRent
    );

    const property = await registry.getProperty(1);

    expect(property.owner).to.equal(landlord.address);
    expect(property.title).to.equal("Modern Apartment");
    expect(property.location).to.equal("Tunis");
    expect(property.monthlyRent).to.equal(monthlyRent);
    expect(property.status).to.equal(0);
    expect(await registry.getPropertyCount()).to.equal(1);
  });

  // TEST 3: Rental funding.
  it("Should allow the tenant to fund the rental agreement", async function () {
    const {
      token,
      rental,
      tenant,
      deposit,
      monthlyRent
    } = await createPropertyAndRental();

    const totalAmount = monthlyRent * 2n + deposit;

    // Give the tenant enough test tokens.
    await token.mint(tenant.address, totalAmount);

    // Allow RentalAgreement to transfer the tenant's tokens.
    await token.connect(tenant).approve(rental.target, totalAmount);

    // Fund the rental.
    await rental.connect(tenant).fundRental(1);

    // Verify the contract received the correct amount.
    expect(await token.balanceOf(rental.target)).to.equal(totalAmount);

    const agreement = await rental.getRentalAgreement(1);

    expect(agreement.funded).to.equal(true);
    expect(agreement.tenant).to.equal(tenant.address);
  });

  // TEST 4: Prevent early rent release.
  it("Should reject rent release before the scheduled start time", async function () {
    const {
      token,
      rental,
      tenant,
      deposit,
      monthlyRent
    } = await createPropertyAndRental();

    const totalAmount = monthlyRent * 2n + deposit;

    await token.mint(tenant.address, totalAmount);
    await token.connect(tenant).approve(rental.target, totalAmount);
    await rental.connect(tenant).fundRental(1);

    await expect(
      rental.releaseMonthlyRent(1)
    ).to.be.revertedWith("Rent is not due yet");
  });

  // TEST 5: Monthly rent release.
  it("Should release monthly rent to the landlord when it is due", async function () {
    const {
      token,
      rental,
      tenant,
      landlord,
      deposit,
      monthlyRent
    } = await createPropertyAndRental();

    const totalAmount = monthlyRent * 2n + deposit;

    // Fund the rental.
    await token.mint(tenant.address, totalAmount);
    await token.connect(tenant).approve(rental.target, totalAmount);
    await rental.connect(tenant).fundRental(1);

    // Advance time until the rental start time.
    await advanceTime(3600);

    // Release the first month's rent.
    await rental.releaseMonthlyRent(1);

    // Verify that the landlord received the rent.
    expect(await token.balanceOf(landlord.address)).to.equal(monthlyRent);

    const agreement = await rental.getRentalAgreement(1);
    expect(agreement.monthsPaid).to.equal(1);

    // The second month's rent must not be released immediately.
    await expect(
      rental.releaseMonthlyRent(1)
    ).to.be.revertedWith("Rent is not due yet");
  });

  // TEST 6: Security deposit refund.
  it("Should refund the security deposit to the tenant after the rental ends", async function () {
    const {
      token,
      rental,
      tenant,
      deposit,
      monthlyRent
    } = await createPropertyAndRental();

    const totalAmount = monthlyRent * 2n + deposit;

    // Fund the rental.
    await token.mint(tenant.address, totalAmount);
    await token.connect(tenant).approve(rental.target, totalAmount);
    await rental.connect(tenant).fundRental(1);

    // Wait until the rental starts.
    await advanceTime(3600);

    // Release the first month's rent.
    await rental.releaseMonthlyRent(1);

    // Wait 30 days for the second month's rent.
    await advanceTime(30 * 24 * 60 * 60);

    // Release the second month's rent.
    await rental.releaseMonthlyRent(1);

    // Wait until the complete rental period has ended.
    await advanceTime(30 * 24 * 60 * 60);

    // Refund the security deposit.
    await rental.refundSecurityDeposit(1);

    // Verify that the tenant received the deposit.
    expect(await token.balanceOf(tenant.address)).to.equal(deposit);

    const agreement = await rental.getRentalAgreement(1);
    expect(agreement.completed).to.equal(true);
  });

  // TEST 7: Dispute resolution.
  it("Should allow the arbitrator to resolve a dispute and distribute the funds", async function () {
    const {
      token,
      rental,
      tenant,
      landlord,
      arbitrator,
      outsider,
      deposit,
      monthlyRent
    } = await createPropertyAndRental();

    const totalAmount = monthlyRent * 2n + deposit;

    // Fund the rental.
    await token.mint(tenant.address, totalAmount);
    await token.connect(tenant).approve(rental.target, totalAmount);
    await rental.connect(tenant).fundRental(1);

    // The tenant opens a dispute.
    await rental.connect(tenant).openDispute(1);

    // An unauthorized account must not resolve the dispute.
    await expect(
      rental.connect(outsider).resolveDispute(
        1,
        ethers.parseUnits("600", 6),
        ethers.parseUnits("400", 6)
      )
    ).to.be.revertedWith("Not authorized arbitrator");

    // The authorized arbitrator resolves the dispute.
    const tenantDepositShare = ethers.parseUnits("600", 6);
    const landlordDepositShare = ethers.parseUnits("400", 6);

    await rental.connect(arbitrator).resolveDispute(
      1,
      tenantDepositShare,
      landlordDepositShare
    );

    // Since no rent was released, all prepaid rent is returned to the tenant.
    const unusedRent = monthlyRent * 2n;

    // Verify the tenant received unused rent and their deposit share.
    expect(await token.balanceOf(tenant.address)).to.equal(
      unusedRent + tenantDepositShare
    );

    // Verify the landlord received their deposit share.
    expect(await token.balanceOf(landlord.address)).to.equal(
      landlordDepositShare
    );

    // Verify that the agreement is completed.
    const agreement = await rental.getRentalAgreement(1);
    expect(agreement.completed).to.equal(true);
  });

});
