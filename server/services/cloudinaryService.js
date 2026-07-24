const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');

const hasCloudinaryConfig = () => (
  process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET
);

const uploadProfilePicture = (buffer, userId) => new Promise((resolve, reject) => {
  if (!hasCloudinaryConfig()) {
    const error = new Error('Profile image storage is not configured');
    error.status = 503;
    reject(error);
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const upload = cloudinary.uploader.upload_stream(
    {
      folder: 'ideanexus/profile-pictures',
      public_id: `user-${userId}`,
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    },
    (error, result) => {
      if (error) return reject(error);
      return resolve(result.secure_url);
    },
  );

  streamifier.createReadStream(buffer).pipe(upload);
});

const deleteProfilePicture = async (userId) => {
  if (!hasCloudinaryConfig()) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  await cloudinary.uploader.destroy(`ideanexus/profile-pictures/user-${userId}`, {
    resource_type: 'image',
    invalidate: true,
  });
};

module.exports = { uploadProfilePicture, deleteProfilePicture };
