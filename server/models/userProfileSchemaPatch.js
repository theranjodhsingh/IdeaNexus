const User = require('./User');

// This extension deliberately lives outside the protected User model. Mongoose
// applies it to the same registered model, while existing user documents retain
// a null value until a picture is uploaded.
if (!User.schema.path('profilePictureUrl')) {
  User.schema.add({
    profilePictureUrl: {
      type: String,
      default: null,
      trim: true,
    },
  });
}

module.exports = User;
