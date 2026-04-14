import multer from 'multer';

export function handleUploadError(upload) {
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'File too large! Max 5MB.');
                } else if (err.code === 'LIMIT_FILE_COUNT') {
                    req.flash('error', 'Too many files!');
                } else {
                    req.flash('error', err.message);
                }
                return res.redirect('my-project'); // Go back to form
            } else if (err) {
                req.flash('error', err.message);
                return res.redirect('my-project');
            } else {
                next(); // Success
            }
        });
    };
}