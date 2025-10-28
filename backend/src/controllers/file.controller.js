// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const logger = require('../config/logger');

/**
 * Upload file and optionally scale images
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }

    const file = req.file;
    const filePath = file.path;
    const originalName = file.originalname;
    const fileExt = path.extname(originalName).toLowerCase();
    
    // Get the date directory from the file path
    const dateDir = path.basename(path.dirname(filePath)); // YYYY-MM-DD
    const finalFileName = file.filename;
    
    // Check if it's an image file
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(fileExt);
    
    let finalFilePath = filePath;

    // If it's an image, try to scale it down
    if (isImage) {
      try {
        const maxDimension = config.fileUpload?.maxImageDimension || 1024;
        
        // Get image metadata
        const metadata = await sharp(filePath).metadata();
        const { width, height } = metadata;
        
        // Check if scaling is needed
        if (width > maxDimension || height > maxDimension) {
          logger.info(`Scaling image from ${width}x${height} to max ${maxDimension}px`);
          
          // Calculate new dimensions maintaining aspect ratio
          let newWidth = width;
          let newHeight = height;
          
          if (width > height) {
            newWidth = maxDimension;
            newHeight = Math.round((height * maxDimension) / width);
          } else {
            newHeight = maxDimension;
            newWidth = Math.round((width * maxDimension) / height);
          }
          
          // Create scaled image
          const scaledFileName = `scaled_${file.filename}`;
          const scaledFilePath = path.join(path.dirname(filePath), scaledFileName);
          
          await sharp(filePath)
            .resize(newWidth, newHeight, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 90 })
            .toFile(scaledFilePath);
          
          // Remove original file and rename scaled file
          fs.unlinkSync(filePath);
          fs.renameSync(scaledFilePath, filePath);
          
          logger.info(`Image scaled to ${newWidth}x${newHeight}`);
        }
      } catch (scaleError) {
        logger.warn(`Failed to scale image: ${scaleError.message}`);
        // Continue with original file if scaling fails
      }
    }

    // Generate accessible URL with date directory
    const fileUrl = `/d/${dateDir}/${finalFileName}`;
    
    logger.info(`File uploaded successfully: ${originalName} -> ${fileUrl}`);
    
    res.status(httpStatus.OK).json({
      url: fileUrl
    });
  } catch (error) {
    logger.error(`File upload error: ${error.message}`);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    next(error);
  }
};

module.exports = {
  uploadFile,
};
