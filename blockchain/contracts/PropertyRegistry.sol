
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PropertyRegistry {

    enum PropertyStatus {
        AVAILABLE,
        RENTED,
        INACTIVE
    }

    struct Property {
        uint256 id;
        address owner;
        string title;
        string location;
        uint256 monthlyRent;
        PropertyStatus status;
        bool exists;
    }

    // The next ID to assign to a property.
    uint256 private nextPropertyId = 1;

    // Stores properties using their unique IDs.
    mapping(uint256 => Property) private properties;

    // Events allow the frontend to detect blockchain changes.
    event PropertyRegistered(
        uint256 indexed propertyId,
        address indexed owner,
        string title,
        uint256 monthlyRent
    );

    event PropertyStatusChanged(
        uint256 indexed propertyId,
        PropertyStatus status
    );

    // Only the property owner can execute protected operations.
    modifier onlyPropertyOwner(uint256 propertyId) {
        require(properties[propertyId].exists, "Property does not exist");
        require(
            properties[propertyId].owner == msg.sender,
            "Not property owner"
        );
        _;
    }

    // Register a new property.
    function registerProperty(
        string memory title,
        string memory location,
        uint256 monthlyRent
    ) external returns (uint256) {

        require(bytes(title).length > 0, "Title required");
        require(bytes(location).length > 0, "Location required");
        require(monthlyRent > 0, "Rent must be greater than zero");

        uint256 propertyId = nextPropertyId;

        properties[propertyId] = Property({
            id: propertyId,
            owner: msg.sender,
            title: title,
            location: location,
            monthlyRent: monthlyRent,
            status: PropertyStatus.AVAILABLE,
            exists: true
        });

        nextPropertyId++;

        emit PropertyRegistered(
            propertyId,
            msg.sender,
            title,
            monthlyRent
        );

        return propertyId;
    }

    // Retrieve a property's information.
    function getProperty(
        uint256 propertyId
    ) external view returns (Property memory) {

        require(properties[propertyId].exists, "Property does not exist");

        return properties[propertyId];
    }

    // Return the total number of registered properties.
    function getPropertyCount() external view returns (uint256) {
        return nextPropertyId - 1;
    }

    // Change the property's availability.
    function setPropertyStatus(
        uint256 propertyId,
        PropertyStatus status
    ) external onlyPropertyOwner(propertyId) {

        properties[propertyId].status = status;

        emit PropertyStatusChanged(propertyId, status);
    }
}
