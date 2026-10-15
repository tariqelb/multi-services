// import express from "express";
// import propertyUpload from "../../middleware/propertyUpload.js";
// import { createProperty } from "../../controllers/property/propertyController.js";
// import { getProperties } from '../../controllers/property/getProperties.js';

// const router = express.Router();

// // Existing POST route...
// router.post("/insert", propertyUpload.array("images", 15), createProperty);

// // GET route with a custom inline logging middleware (or your auth middleware)
// router.get(
//     '/getlist',
//     (req, res, next) => {
//         console.log("\n[Route] GET /api/property/getlist endpoint reached");
//         console.log("[Route] IP:", req.ip);
//         next();
//     },
//     getProperties
// );

// export default router;


import express from "express";
import propertyUpload from "../../middleware/propertyUpload.js";
import { createProperty } from "../../controllers/property/propertyController.js";
import { getProperties } from '../../controllers/property/getProperties.js'



const router = express.Router();

router.post(
    "/insert",

    // Log before Multer
    (req, res, next) => {
        console.log("\n[Route] Property insert endpoint reached");
        console.log("[Route] URL:", req.originalUrl);
        console.log("[Route] Content-Type:", req.headers["content-type"]);
        next();
    },

    // Parse multipart form data and save uploaded files
    propertyUpload.array("images", 15),

    //Log after Multer
    (req, res, next) => {
        console.log("[After Multer] File count:", req.files?.length ?? 0);
        console.log(
            "[After Multer] Files:",
            (req.files || []).map((file) => ({
                fieldname: file.fieldname,
                originalname: file.originalname,
                filename: file.filename,
                size: file.size,
                path: file.path,
            }))
        );
        next();
    },

    createProperty
);
router.get('/getlist', getProperties);

export default router;