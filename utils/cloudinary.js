import {v2 as cloudinary} from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;

export async function safeDestroy(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`Failed to clean up Cloudinary asset ${publicId}:`, err);
  }
}

export const safeDestroyMany = async (images) => {
  if (!Array.isArray(images) || images.length === 0) return;
  await Promise.all(
    images
      .filter((img) => img?.public_id)
      .map((img) => safeDestroy(img.public_id))
  );
};
