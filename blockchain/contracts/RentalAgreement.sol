
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {PropertyRegistry} from "./PropertyRegistry.sol";

contract RentalAgreement is ReentrancyGuard {

    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken;
    PropertyRegistry public immutable propertyRegistry;
    address public immutable arbitrator;

    uint256 private nextRentalId = 1;

        // A zero value means that the property has no active agreement.
        mapping(uint256 => uint256) public activeRentalByProperty;

    struct Rental {
        uint256 id;
        uint256 propertyId;
        address landlord;
        address tenant;
        uint256 monthlyRent;
        uint256 securityDeposit;
        uint256 durationMonths;
        uint256 startTime;
        uint256 monthsPaid;
        bool funded;
        bool disputed;
        bool completed;
    }

    mapping(uint256 => Rental) private rentals;

    event RentalAgreementCreated(
        uint256 indexed rentalId,
        uint256 indexed propertyId,
        address landlord,
        address tenant
    );

    event RentalFunded(
        uint256 indexed rentalId,
        uint256 totalAmount
    );

    event RentReleased(
        uint256 indexed rentalId,
        uint256 amount,
        uint256 monthNumber
    );

    event SecurityDepositRefunded(
        uint256 indexed rentalId,
        uint256 amount
    );

    event DisputeOpened(uint256 indexed rentalId, address openedBy);

    event DisputeResolved(
        uint256 indexed rentalId,
        uint256 tenantAmount,
        uint256 landlordAmount
    );

    event RentalCancelled(uint256 indexed rentalId);

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Not authorized arbitrator");
        _;
    }

    constructor(
        address tokenAddress,
        address registryAddress,
        address arbitratorAddress
    ) {
        require(tokenAddress != address(0), "Invalid token address");
        require(registryAddress != address(0), "Invalid registry address");
        require(arbitratorAddress != address(0), "Invalid arbitrator");

        paymentToken = IERC20(tokenAddress);
        propertyRegistry = PropertyRegistry(registryAddress);
        arbitrator = arbitratorAddress;
    }

    // 1. Landlord creates a rental agreement.
    function createRentalAgreement(
        uint256 propertyId,
        address tenant,
        uint256 securityDeposit,
        uint256 durationMonths,
        uint256 startTime
    ) external returns (uint256) {

        PropertyRegistry.Property memory property =
            propertyRegistry.getProperty(propertyId);

        require(property.owner == msg.sender, "Not property owner");
        require(
            property.status == PropertyRegistry.PropertyStatus.AVAILABLE,
            "Property not available"
        );
        require(tenant != address(0), "Invalid tenant address");
        require(tenant != msg.sender, "Landlord cannot be tenant");
        require(securityDeposit > 0, "Deposit must be positive");
        require(durationMonths > 0, "Duration must be positive");
        require(startTime >= block.timestamp, "Invalid start time");
        require(
            activeRentalByProperty[propertyId] == 0,
            "Property already has an active rental"
        );

        uint256 rentalId = nextRentalId++;

        rentals[rentalId] = Rental({
            id: rentalId,
            propertyId: propertyId,
            landlord: msg.sender,
            tenant: tenant,
            monthlyRent: property.monthlyRent,
            securityDeposit: securityDeposit,
            durationMonths: durationMonths,
            startTime: startTime,
            monthsPaid: 0,
            funded: false,
            disputed: false,
            completed: false
        });

        activeRentalByProperty[propertyId] = rentalId;

        emit RentalAgreementCreated(
            rentalId,
            propertyId,
            msg.sender,
            tenant
        );

        return rentalId;
    }

    // 2. Tenant funds the complete rental period and security deposit.
    function fundRental(uint256 rentalId) external nonReentrant {

        Rental storage rental = rentals[rentalId];

        require(rental.id != 0, "Rental does not exist");
        require(msg.sender == rental.tenant, "Not the tenant");
        require(!rental.funded, "Already funded");
        require(!rental.completed, "Rental completed");

        uint256 totalRent =
            rental.monthlyRent * rental.durationMonths;

        uint256 totalAmount =
            totalRent + rental.securityDeposit;

        rental.funded = true;

        paymentToken.safeTransferFrom(
            msg.sender,
            address(this),
            totalAmount
        );

        emit RentalFunded(rentalId, totalAmount);
    }

    // 3. Release one monthly rent payment to the landlord.
    function releaseMonthlyRent(uint256 rentalId)
        external
        nonReentrant
    {
        Rental storage rental = rentals[rentalId];

        require(rental.funded, "Rental not funded");
        require(!rental.disputed, "Rental is disputed");
        require(!rental.completed, "Rental completed");
        require(
            rental.monthsPaid < rental.durationMonths,
            "All rent already released"
        );

        uint256 nextPaymentTime =
            rental.startTime + rental.monthsPaid * 30 days;

        require(
            block.timestamp >= nextPaymentTime,
            "Rent is not due yet"
        );

        rental.monthsPaid++;

        paymentToken.safeTransfer(
            rental.landlord,
            rental.monthlyRent
        );

        emit RentReleased(
            rentalId,
            rental.monthlyRent,
            rental.monthsPaid
        );
    }

    // 4. Refund the security deposit after the rental period.
    function refundSecurityDeposit(uint256 rentalId)
        external
        nonReentrant
    {
        Rental storage rental = rentals[rentalId];

        require(rental.funded, "Rental not funded");
        require(!rental.disputed, "Rental is disputed");
        require(!rental.completed, "Rental already completed");
        require(
            rental.monthsPaid == rental.durationMonths,
            "Rent payments are incomplete"
        );

        uint256 rentalEndTime =
            rental.startTime + rental.durationMonths * 30 days;

        require(
            block.timestamp >= rentalEndTime,
            "Rental period has not ended"
        );

        rental.completed = true;
        activeRentalByProperty[rental.propertyId] = 0;

        paymentToken.safeTransfer(
            rental.tenant,
            rental.securityDeposit
        );

        emit SecurityDepositRefunded(
            rentalId,
            rental.securityDeposit
        );
    }

    // 5. Either party can open a dispute.
    function openDispute(uint256 rentalId) external {

        Rental storage rental = rentals[rentalId];

        require(rental.funded, "Rental not funded");
        require(!rental.completed, "Rental completed");
        require(!rental.disputed, "Dispute already opened");

        require(
            msg.sender == rental.landlord ||
            msg.sender == rental.tenant,
            "Not a rental party"
        );

        rental.disputed = true;

        emit DisputeOpened(rentalId, msg.sender);
    }

    // 6. The arbitrator distributes the deposit and refunds unused rent.
    function resolveDispute(
        uint256 rentalId,
        uint256 tenantDepositShare,
        uint256 landlordDepositShare
    ) external onlyArbitrator nonReentrant {

        Rental storage rental = rentals[rentalId];

        require(rental.disputed, "No active dispute");
        require(!rental.completed, "Rental completed");

        require(
            tenantDepositShare + landlordDepositShare ==
                rental.securityDeposit,
            "Invalid deposit distribution"
        );

        uint256 remainingMonths =
            rental.durationMonths - rental.monthsPaid;

        uint256 remainingRent =
            rental.monthlyRent * remainingMonths;

        rental.completed = true;
        activeRentalByProperty[rental.propertyId] = 0;

        // Return the unused rent to the tenant.
        if (remainingRent > 0) {
            paymentToken.safeTransfer(
                rental.tenant,
                remainingRent
            );
        }

        if (tenantDepositShare > 0) {
            paymentToken.safeTransfer(
                rental.tenant,
                tenantDepositShare
            );
        }

        if (landlordDepositShare > 0) {
            paymentToken.safeTransfer(
                rental.landlord,
                landlordDepositShare
            );
        }

        emit DisputeResolved(
            rentalId,
            tenantDepositShare,
            landlordDepositShare
        );
    }

    // 7. Cancel an agreement if it has not yet been funded.
    function cancelUnfundedRental(uint256 rentalId) external {

        Rental storage rental = rentals[rentalId];

        require(rental.id != 0, "Rental does not exist");
        require(!rental.funded, "Rental already funded");
        require(!rental.completed, "Rental completed");

        require(
            msg.sender == rental.landlord ||
            msg.sender == rental.tenant,
            "Not a rental party"
        );

        rental.completed = true;
        activeRentalByProperty[rental.propertyId] = 0;

        emit RentalCancelled(rentalId);
    }

    // Retrieve the complete rental agreement.
    function getRentalAgreement(uint256 rentalId)
        external
        view
        returns (Rental memory)
    {
        require(rentals[rentalId].id != 0, "Rental does not exist");

        return rentals[rentalId];
    }
}
