import type { Landlord, Payment, Property, RentalAgreement, Tenant, Transaction } from "./types";

export const landlords: Landlord[] = [
  { id: "landlord-1", name: "Amine Ben Salah", initials: "AB", email: "amine@example.com", joined: "2023", rating: 4.9 },
  { id: "landlord-2", name: "Sonia Trabelsi", initials: "ST", email: "sonia@example.com", joined: "2022", rating: 4.8 },
];

export const tenants: Tenant[] = [
  { id: "tenant-1", name: "Malek Gdoura", email: "malek@example.com" },
  { id: "tenant-2", name: "Yasmine Khelifi", email: "yasmine@example.com" },
];

export const properties: Property[] = [
  {
    id: "lac-2-apartment",
    title: "Modern Apartment",
    location: "Tunis, Lac 2",
    address: "12 Rue du Lac Turkana, Tunis",
    type: "Apartment",
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    rent: 500,
    deposit: 1000,
    leaseDuration: 12,
    status: "Available",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
    description: "A bright, carefully finished apartment in the heart of Lac 2. Enjoy open-plan living, generous natural light, and quick access to business districts, cafes, and the lake.",
    landlordId: "landlord-1",
    amenities: ["High-speed internet", "Parking", "Air conditioning", "24/7 building security"],
  },
  {
    id: "marsas-house",
    title: "Seaside Family Home",
    location: "La Marsa, Tunis",
    address: "8 Avenue Habib Bourguiba, La Marsa",
    type: "House",
    bedrooms: 3,
    bathrooms: 2,
    area: 160,
    rent: 900,
    deposit: 1800,
    leaseDuration: 12,
    status: "Available",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    description: "A calm and spacious family home minutes from the beach, with a private garden and a welcoming terrace for relaxed evenings.",
    landlordId: "landlord-2",
    amenities: ["Private garden", "Terrace", "Garage", "Fitted kitchen"],
  },
  {
    id: "centre-studio",
    title: "City Centre Studio",
    location: "Centre Urbain Nord",
    address: "4 Rue de l'Innovation, Tunis",
    type: "Studio",
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    rent: 350,
    deposit: 700,
    leaseDuration: 6,
    status: "Available",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85",
    description: "An efficient, furnished studio made for modern city living, close to universities, offices, and public transport.",
    landlordId: "landlord-1",
    amenities: ["Furnished", "Elevator", "Concierge", "Workspace"],
  },
  {
    id: "carthage-villa",
    title: "Carthage Garden Villa",
    location: "Carthage, Tunis",
    address: "21 Avenue de Carthage, Carthage",
    type: "Villa",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    rent: 1800,
    deposit: 3600,
    leaseDuration: 24,
    status: "Rented",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85",
    description: "A distinctive villa surrounded by greenery in one of Tunis' most sought-after neighbourhoods.",
    landlordId: "landlord-2",
    amenities: ["Garden", "Pool", "Garage", "Guest suite"],
  },
];

export const rentalAgreements: RentalAgreement[] = [
  { id: "AGR-2026-001", propertyId: "lac-2-apartment", landlordId: "landlord-1", tenantId: "tenant-1", startDate: "2026-01-01", endDate: "2026-12-31", status: "Active", monthlyRent: 500, deposit: 1000 },
];

export const payments: Payment[] = [
  { id: "pay-1", date: "2026-12-01", label: "December Rent", amount: 500, type: "Rent", status: "Paid", reference: "RB-8F21A" },
  { id: "pay-2", date: "2026-11-01", label: "November Rent", amount: 500, type: "Rent", status: "Paid", reference: "RB-7D90C" },
  { id: "pay-3", date: "2026-10-01", label: "October Rent", amount: 500, type: "Rent", status: "Paid", reference: "RB-6A14B" },
  { id: "pay-4", date: "2026-01-01", label: "Security Deposit", amount: 1000, type: "Deposit", status: "Confirmed" as Payment["status"], reference: "RB-0D22F" },
];

export const transactions: Transaction[] = [
  { id: "tx-1", status: "Confirmed", label: "Security deposit escrow" },
  { id: "tx-2", status: "Pending", label: "January rent payment" },
];
