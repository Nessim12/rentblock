export type PropertyType = "Apartment" | "House" | "Studio" | "Villa";
export type PropertyStatus = "Available" | "Rented" | "Draft";
export type PaymentStatus = "Paid" | "Pending" | "Failed";

export interface Landlord {
  id: string;
  name: string;
  initials: string;
  email: string;
  joined: string;
  rating: number;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
}

export interface Property {
  id: string;
  title: string;
  location: string;
  address: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  area: number;
  rent: number;
  deposit: number;
  leaseDuration: number;
  status: PropertyStatus;
  image: string;
  description: string;
  landlordId: string;
  amenities: string[];
}

export interface Payment {
  id: string;
  date: string;
  label: string;
  amount: number;
  type: "Rent" | "Deposit";
  status: PaymentStatus;
  reference: string;
}

export interface RentalAgreement {
  id: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Pending" | "Ended";
  monthlyRent: number;
  deposit: number;
}

export interface Transaction {
  id: string;
  status: "Pending" | "Confirmed";
  label: string;
}
