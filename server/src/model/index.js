const sequelize = require("../config/database");

// importing schemas
const User = require("./user/User");
const ProfilePhoto = require("./user/ProfilePhoto");
const Listing = require("./listing/Listing");
const ListingImage = require("./listing/ListingImage");
const Tag = require("./listing/Tag");
const UserReview = require('./review/UserReview');
const ListingReview = require('./review/ListingReview')
const Conversation = require('./message/Conversation');
const Message = require('./message/Message');
const Reservation = require('./reservation/Reservation')

// User and ProfilePhoto relationship
User.hasOne(ProfilePhoto, { foreignKey: "userId", onDelete: "CASCADE",as: "profilePhoto" });
ProfilePhoto.belongsTo(User, { foreignKey: "userId" });


// User and Listing relationship
User.hasMany(Listing, { foreignKey: "userId", onDelete: "CASCADE", as: "listings" });
Listing.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE", as: "user" });

// User and Reservation relationship
User.hasMany(Reservation, {foreignKey: "userId", onDelete: "CASCADE", as: "reservations"});
Reservation.belongsTo(User, {foreignKey: "userId"});

// User and Review relationship
// recieved reviews
User.hasMany(UserReview, { foreignKey: "revieweeId", as: "reviews" });
UserReview.belongsTo(User, { foreignKey: "revieweeId", as:"reviewee" });


// User and Conversation realtionship
// if user is the seller in the conversation
User.hasMany(Conversation, { foreignKey: "sellerId", as: "sellerConversations"});
Conversation.belongsTo(User, { foreignKey: "sellerId", as: "seller"});
// if user is the buyer in the conversation
User.hasMany(Conversation, { foreignKey: "buyerId", as: "buyerConversations"});
Conversation.belongsTo(User, { foreignKey: "buyerId", as: "buyer"});

// Define associations in one place
Listing.hasMany(ListingImage, {foreignKey: "listingId", onDelete: "CASCADE", as: "listingImages"});
ListingImage.belongsTo(Listing, {foreignKey: "listingId", onDelete: "CASCADE", as: "listing",});


// Listing and Tag relationship
Listing.hasMany(Tag, { foreignKey: "listingId", as: "tags", onDelete: "CASCADE" });
Tag.belongsTo(Listing, { foreignKey: "listingId" });


// Listing and Conversation relationship
Listing.hasMany(Conversation, { foreignKey: "listingId", as: "conversations", onDelete: "CASCADE" });
Conversation.belongsTo(Listing, { foreignKey: "listingId" });


// Listing and Reservation relationship
Listing.hasMany(Reservation, { foreignKey: "listingId", as: "reservations", onDelete: "CASCADE"});
Reservation.belongsTo(Listing, { foreignKey: "listingId"});

// Message and Conversation relationship
Conversation.hasMany(Message, { foreignKey: "conversationId", as: "messages", onDelete: "CASCADE" });
Message.belongsTo(Conversation, {foreignKey: "conversationId", as: "conversation"})

// Message and User relationship for sender
User.hasMany(Message, { foreignKey: "senderId", as: "sentMessages" });
Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });


// Listing and review relationship
Listing.hasMany(ListingReview, {foreignKey: "listingId", as: "reviews", onDelete: "CASCADE"});
ListingReview.belongsTo(Listing, {foreignKey: "listingId"})


// Export all models plus the sequelize instance and helper functions
module.exports = { 
  sequelize, 
  User, 
  ProfilePhoto, 
  Listing, 
  ListingImage, 
  Tag,
  UserReview,
  ListingReview,
  Conversation,
  Message,
  Reservation
};
