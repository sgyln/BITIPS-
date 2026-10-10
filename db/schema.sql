-- BITIPS relational schema: 17 entities in 3NF, generated from the Data Dictionary in BITIPS_Final_revised.docx.
-- Lines marked EXTENSION are columns added for UI/intake parameters named in the proposal text (origin, group size, currency, data-status labels).
-- MySQL-style types, as written in the dictionary.

CREATE TABLE user (
  UserID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the user
  FirstName VARCHAR(50) NOT NULL,  -- User's first name
  LastName VARCHAR(50) NOT NULL,  -- User's last name
  Email VARCHAR(100) NOT NULL,  -- User's unique email address
  PasswordHash VARCHAR(255) NOT NULL,  -- Encrypted/hashed user password
  PhoneNumber VARCHAR(20) NULL,  -- User's contact number
  UserRole VARCHAR(20) NOT NULL,  -- User type, such as Traveler or Administrator
  AccountStatus VARCHAR(20) NOT NULL,  -- Current account status
  CreatedAt DATETIME NOT NULL,  -- Date and time the account was created
  UpdatedAt DATETIME NULL,  -- Date and time the account was last updated
  PRIMARY KEY (UserID),
  UNIQUE (Email)
);

CREATE TABLE user_preference (
  PreferenceID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the preference record
  UserID INT NOT NULL,  -- References the user who owns the preferences
  PreferredDestination VARCHAR(100) NULL,  -- User's preferred destination
  PreferredActivityType VARCHAR(50) NULL,  -- Preferred type of activities
  PreferredAccommodationType VARCHAR(50) NULL,  -- Preferred type of accommodation
  PreferredTransportType VARCHAR(50) NULL,  -- Preferred mode of transportation
  PreferredMealPreference VARCHAR(50) NULL,  -- Preferred meal or food preference
  PreferredBudgetLevel VARCHAR(30) NULL,  -- User's preferred budget category
  PreferredTravelStyle VARCHAR(50) NULL,  -- Travel style such as leisure, adventure, or cultural
  UpdatedAt DATETIME NULL,  -- Date and time preferences were last updated
  TravelPace VARCHAR(20) NULL,  -- EXTENSION: Relaxed / Moderate / Fast-Paced
  DisplayCurrency CHAR(3) NULL,  -- EXTENSION: settings
  Language VARCHAR(20) NULL,  -- EXTENSION: settings
  NotifyBudgetAlerts BOOLEAN NULL,  -- EXTENSION: settings
  NotifyReminders BOOLEAN NULL,  -- EXTENSION: settings
  NotifyTips BOOLEAN NULL,  -- EXTENSION: settings
  PRIMARY KEY (PreferenceID),
  FOREIGN KEY (UserID) REFERENCES user(UserID)
);

CREATE TABLE audit_log (
  AuditLogID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the audit record
  UserID INT NOT NULL,  -- User who performed the activity
  ActionType VARCHAR(50) NOT NULL,  -- Type of action performed
  ActionDescription VARCHAR(255) NULL,  -- Description of the activity
  ActionDateTime DATETIME NOT NULL,  -- Date and time of the activity
  IPAddress VARCHAR(45) NULL,  -- IP address from which the activity occurred
  ActivityStatus VARCHAR(20) NOT NULL,  -- Result/status of the activity
  PRIMARY KEY (AuditLogID),
  FOREIGN KEY (UserID) REFERENCES user(UserID)
);

CREATE TABLE destination (
  DestinationID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the destination
  DestinationName VARCHAR(100) NOT NULL,  -- Name of the destination
  Country VARCHAR(100) NOT NULL,  -- Country where the destination is located
  Region VARCHAR(100) NULL,  -- Region, state, or province
  City VARCHAR(100) NULL,  -- City of the destination
  Description TEXT NULL,  -- Description of the destination
  Latitude DECIMAL(10,7) NULL,  -- Geographic latitude
  Longitude DECIMAL(10,7) NULL,  -- Geographic longitude
  Status VARCHAR(20) NOT NULL,  -- Availability/status of the destination
  Accessibility VARCHAR(10) NOT NULL DEFAULT 'Road',  -- EXTENSION: Road or Boat access (ocean-boundary routing)
  PRIMARY KEY (DestinationID)
);

CREATE TABLE activity (
  ActivityID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the activity
  DestinationID INT NOT NULL,  -- Destination where the activity is located
  ActivityName VARCHAR(100) NOT NULL,  -- Name of the activity
  ActivityType VARCHAR(50) NOT NULL,  -- Category/type of activity
  Description TEXT NULL,  -- Description of the activity
  Duration INT NULL,  -- Estimated activity duration in minutes
  ActivityCost DECIMAL(12,2) NOT NULL,  -- Estimated cost of the activity
  OpeningTime TIME NULL,  -- Opening time
  ClosingTime TIME NULL,  -- Closing time
  AvailabilityStatus VARCHAR(20) NOT NULL,  -- Current availability status
  DataStatus VARCHAR(20) NOT NULL DEFAULT 'Admin-Maintained',  -- EXTENSION: data status label
  PRIMARY KEY (ActivityID),
  FOREIGN KEY (DestinationID) REFERENCES destination(DestinationID)
);

CREATE TABLE accommodation (
  AccommodationID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the accommodation
  DestinationID INT NOT NULL,  -- Destination where the accommodation is located
  AccommodationName VARCHAR(100) NOT NULL,  -- Name of the accommodation
  AccommodationType VARCHAR(50) NOT NULL,  -- Type of accommodation
  Address VARCHAR(255) NULL,  -- Physical address
  ContactNumber VARCHAR(20) NULL,  -- Contact number
  PricePerNight DECIMAL(12,2) NOT NULL,  -- Cost per night
  Rating DECIMAL(2,1) NULL,  -- Accommodation rating
  AvailabilityStatus VARCHAR(20) NOT NULL,  -- Current availability status
  DataStatus VARCHAR(20) NOT NULL DEFAULT 'Admin-Maintained',  -- EXTENSION: data status label
  PRIMARY KEY (AccommodationID),
  FOREIGN KEY (DestinationID) REFERENCES destination(DestinationID)
);

CREATE TABLE meal_option (
  MealID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the meal option
  DestinationID INT NOT NULL,  -- Destination associated with the meal
  MealName VARCHAR(100) NOT NULL,  -- Name of the meal
  MealType VARCHAR(30) NOT NULL,  -- Type such as breakfast, lunch, or dinner
  Description TEXT NULL,  -- Description of the meal
  Price DECIMAL(12,2) NOT NULL,  -- Price of the meal
  AvailabilityStatus VARCHAR(20) NOT NULL,  -- Current availability status
  Cuisine VARCHAR(30) NULL,  -- EXTENSION: meal preference category
  DataStatus VARCHAR(20) NOT NULL DEFAULT 'Estimated',  -- EXTENSION: data status label
  PRIMARY KEY (MealID),
  FOREIGN KEY (DestinationID) REFERENCES destination(DestinationID)
);

CREATE TABLE transport_option (
  TransportID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the transportation option
  DestinationID INT NOT NULL,  -- Destination associated with the transportation option
  TransportType VARCHAR(50) NOT NULL,  -- Type of transportation
  ProviderName VARCHAR(100) NULL,  -- Transportation provider
  RouteDescription VARCHAR(255) NULL,  -- Description of the route
  EstimatedDuration INT NULL,  -- Estimated travel duration in minutes
  Fare DECIMAL(12,2) NOT NULL,  -- Transportation fare
  AvailabilityStatus VARCHAR(20) NOT NULL,  -- Current availability status
  DataStatus VARCHAR(20) NOT NULL DEFAULT 'Admin-Maintained',  -- EXTENSION: data status label
  PRIMARY KEY (TransportID),
  FOREIGN KEY (DestinationID) REFERENCES destination(DestinationID)
);

CREATE TABLE itinerary (
  ItineraryID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the itinerary
  UserID INT NOT NULL,  -- User who owns the itinerary
  DestinationID INT NOT NULL,  -- Main destination of the itinerary
  ItineraryName VARCHAR(100) NOT NULL,  -- Name/title of the itinerary
  StartDate DATE NOT NULL,  -- Start date of the trip
  EndDate DATE NOT NULL,  -- End date of the trip
  NumberOfDays INT NOT NULL,  -- Total number of travel days
  Status VARCHAR(30) NOT NULL,  -- Current itinerary status
  CreatedAt DATETIME NOT NULL,  -- Date and time the itinerary was created
  UpdatedAt DATETIME NULL,  -- Date and time the itinerary was last updated
  Origin VARCHAR(100) NULL,  -- EXTENSION: trip origin (intake parameter)
  NumberOfTravelers INT NOT NULL DEFAULT 1,  -- EXTENSION: group size (intake parameter)
  PRIMARY KEY (ItineraryID),
  FOREIGN KEY (UserID) REFERENCES user(UserID),
  FOREIGN KEY (DestinationID) REFERENCES destination(DestinationID)
);

CREATE TABLE itinerary_item (
  ItineraryItemID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the itinerary item
  ItineraryID INT NOT NULL,  -- Itinerary containing the item
  ActivityID INT NULL,  -- Activity included in the itinerary
  AccommodationID INT NULL,  -- Accommodation included in the itinerary
  MealID INT NULL,  -- Meal option included in the itinerary
  TransportID INT NULL,  -- Transportation option included in the itinerary
  ItemDate DATE NOT NULL,  -- Date scheduled for the item
  StartTime TIME NULL,  -- Starting time
  EndTime TIME NULL,  -- Ending time
  SequenceNumber INT NOT NULL,  -- Order of the item within the itinerary
  EstimatedCost DECIMAL(12,2) NOT NULL,  -- Estimated cost of the item
  ItemStatus VARCHAR(20) NOT NULL,  -- Current status of the itinerary item
  PRIMARY KEY (ItineraryItemID),
  FOREIGN KEY (ItineraryID) REFERENCES itinerary(ItineraryID),
  FOREIGN KEY (ActivityID) REFERENCES activity(ActivityID),
  FOREIGN KEY (AccommodationID) REFERENCES accommodation(AccommodationID),
  FOREIGN KEY (MealID) REFERENCES meal_option(MealID),
  FOREIGN KEY (TransportID) REFERENCES transport_option(TransportID)
);

CREATE TABLE trip_budget (
  BudgetID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the budget
  ItineraryID INT NOT NULL,  -- Itinerary associated with the budget
  TotalBudget DECIMAL(12,2) NOT NULL,  -- Total planned travel budget
  AccommodationBudget DECIMAL(12,2) NOT NULL,  -- Planned accommodation budget
  TransportationBudget DECIMAL(12,2) NOT NULL,  -- Planned transportation budget
  ActivityBudget DECIMAL(12,2) NOT NULL,  -- Planned activity budget
  MealBudget DECIMAL(12,2) NOT NULL,  -- Planned meal budget
  OtherBudget DECIMAL(12,2) NULL,  -- Budget allocated for other expenses
  BudgetStatus VARCHAR(20) NOT NULL,  -- Current budget status
  CreatedAt DATETIME NOT NULL,  -- Date the budget was created
  UpdatedAt DATETIME NULL,  -- Date the budget was last updated
  DisplayCurrency CHAR(3) NOT NULL DEFAULT 'PHP',  -- EXTENSION: display currency
  ExchangeRate DECIMAL(12,6) NOT NULL DEFAULT 1,  -- EXTENSION: currency snapshot value
  PRIMARY KEY (BudgetID),
  UNIQUE (ItineraryID),
  FOREIGN KEY (ItineraryID) REFERENCES itinerary(ItineraryID)
);

CREATE TABLE expense (
  ExpenseID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the expense
  BudgetID INT NOT NULL,  -- Budget associated with the expense
  ItineraryID INT NOT NULL,  -- Itinerary associated with the expense
  ExpenseCategory VARCHAR(50) NOT NULL,  -- Category of the expense
  ExpenseDescription VARCHAR(255) NULL,  -- Description of the expense
  ExpenseAmount DECIMAL(12,2) NOT NULL,  -- Amount spent
  ExpenseDate DATE NOT NULL,  -- Date the expense occurred
  PaymentMethod VARCHAR(30) NULL,  -- Method used for payment
  ExpenseStatus VARCHAR(20) NOT NULL,  -- Current status of the expense
  PRIMARY KEY (ExpenseID),
  FOREIGN KEY (BudgetID) REFERENCES trip_budget(BudgetID),
  FOREIGN KEY (ItineraryID) REFERENCES itinerary(ItineraryID)
);

CREATE TABLE availability (
  AvailabilityID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the availability record
  ActivityID INT NULL,  -- Activity whose availability is being recorded
  AccommodationID INT NULL,  -- Accommodation whose availability is being recorded
  TransportID INT NULL,  -- Transportation option whose availability is being recorded
  AvailabilityDate DATE NOT NULL,  -- Date for which availability applies
  AvailableQuantity INT NULL,  -- Number of available units/slots
  AvailabilityStatus VARCHAR(20) NOT NULL,  -- Availability status
  LastCheckedAt DATETIME NOT NULL,  -- Date and time availability was last checked
  PRIMARY KEY (AvailabilityID),
  FOREIGN KEY (ActivityID) REFERENCES activity(ActivityID),
  FOREIGN KEY (AccommodationID) REFERENCES accommodation(AccommodationID),
  FOREIGN KEY (TransportID) REFERENCES transport_option(TransportID)
);

CREATE TABLE booking (
  BookingID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the booking
  UserID INT NOT NULL,  -- User who made the booking
  ItineraryID INT NOT NULL,  -- Itinerary associated with the booking
  BookingDate DATETIME NOT NULL,  -- Date and time the booking was made
  BookingStatus VARCHAR(30) NOT NULL,  -- Current booking status
  TotalAmount DECIMAL(12,2) NOT NULL,  -- Total amount of the booking
  ConfirmationCode VARCHAR(50) NOT NULL,  -- Unique booking confirmation code
  PRIMARY KEY (BookingID),
  UNIQUE (ConfirmationCode),
  FOREIGN KEY (UserID) REFERENCES user(UserID),
  FOREIGN KEY (ItineraryID) REFERENCES itinerary(ItineraryID)
);

CREATE TABLE transaction (
  TransactionID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the transaction
  BookingID INT NOT NULL,  -- Booking associated with the transaction
  UserID INT NOT NULL,  -- User who made the transaction
  TransactionDate DATETIME NOT NULL,  -- Date and time of the transaction
  Amount DECIMAL(12,2) NOT NULL,  -- Transaction amount
  PaymentMethod VARCHAR(30) NOT NULL,  -- Payment method used
  TransactionType VARCHAR(30) NOT NULL,  -- Type of transaction
  TransactionStatus VARCHAR(30) NOT NULL,  -- Status of the transaction
  ReferenceNumber VARCHAR(100) NOT NULL,  -- Unique transaction reference
  PRIMARY KEY (TransactionID),
  UNIQUE (ReferenceNumber),
  FOREIGN KEY (BookingID) REFERENCES booking(BookingID),
  FOREIGN KEY (UserID) REFERENCES user(UserID)
);

CREATE TABLE route (
  RouteID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the route
  ItineraryID INT NOT NULL,  -- Itinerary associated with the route
  StartLocation VARCHAR(255) NOT NULL,  -- Starting location
  EndLocation VARCHAR(255) NOT NULL,  -- Ending location
  Distance DECIMAL(10,2) NOT NULL,  -- Calculated route distance
  EstimatedTravelTime INT NULL,  -- Estimated travel time in minutes
  RouteDescription TEXT NULL,  -- Description of the generated route
  CreatedAt DATETIME NOT NULL,  -- Date and time the route was generated
  PRIMARY KEY (RouteID),
  FOREIGN KEY (ItineraryID) REFERENCES itinerary(ItineraryID)
);

CREATE TABLE pdf_report (
  ReportID INT NOT NULL AUTO_INCREMENT,  -- Unique identifier of the report
  ItineraryID INT NOT NULL,  -- Itinerary included in the report
  UserID INT NOT NULL,  -- User who requested/generated the report
  ReportType VARCHAR(50) NOT NULL,  -- Type of generated report
  GeneratedDate DATETIME NOT NULL,  -- Date and time the report was generated
  FileName VARCHAR(255) NOT NULL,  -- Name of the generated PDF file
  ReportStatus VARCHAR(20) NOT NULL,  -- Current status of the report
  PRIMARY KEY (ReportID),
  FOREIGN KEY (ItineraryID) REFERENCES itinerary(ItineraryID),
  FOREIGN KEY (UserID) REFERENCES user(UserID)
);
