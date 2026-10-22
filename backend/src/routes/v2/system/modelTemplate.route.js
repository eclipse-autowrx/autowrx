const express = require('express');
const auth = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const { modelTemplateController } = require('../../../controllers');
const { modelTemplateValidation } = require('../../../validations');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

// Public read endpoints
router.route('/').get(validate(modelTemplateValidation.list), modelTemplateController.list);

router.route('/:id').get(validate(modelTemplateValidation.get), modelTemplateController.getById);

// Admin-only write endpoints
router.use(auth(), checkPermission(PERMISSIONS.ADMIN));

router.route('/').post(validate(modelTemplateValidation.create), modelTemplateController.create);

router
  .route('/:id')
  .put(validate(modelTemplateValidation.update), modelTemplateController.update)
  .delete(validate(modelTemplateValidation.remove), modelTemplateController.remove);

module.exports = router;
