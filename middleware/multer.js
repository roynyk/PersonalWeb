import multer from "multer";
import path from "path";


// STORAGE
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/assets/uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname) // photo.jpg
        const withoutExt = path.basename(file.originalname, ext) // photo
        cb(null, withoutExt + '-' + uniqueSuffix + '-' + ext)
    }
})


// FILE FILTER
const fileFilter = (req, file, cb) => {
    // 1. Check MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    // 2. Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png'];

    // 3. Both must pass!
    const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);
    const isExtensionValid = allowedExt.includes(ext);

    if (isMimeTypeValid && isExtensionValid) {
        cb(null, true);
    } else {
        if (!isMimeTypeValid) {
            cb(new Error('File harus berupa gambar JPG atau PNG!'), false);
        } else {
            cb(new Error('File extention harus berupa JPG atau PNG!'), false);
        }
    }
};

// FILE SIZE LIMIT + CREATE UPLOAD IMAGE
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
        files: 1
    }
})

export default upload;
