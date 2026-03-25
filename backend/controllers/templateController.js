const Template = require('../models/Template');

exports.getTemplates = async (req, res) => {
  try {
    const { type, category } = req.query;
    const filter = { $or: [{ owner: req.user._id }, { isPublic: true }] };
    if (type)     filter.type     = type;
    if (category) filter.category = category;

    const templates = await Template.find(filter).sort({ usageCount: -1, createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { isPublic: true }],
    });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const template = await Template.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    await Template.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.duplicateTemplate = async (req, res) => {
  try {
    const source = await Template.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { isPublic: true }],
    });
    if (!source) return res.status(404).json({ success: false, message: 'Template not found' });

    const copy = await Template.create({
      ...source.toObject(),
      _id: undefined,
      name: `${source.name} (Copy)`,
      owner: req.user._id,
      isPublic: false,
      usageCount: 0,
    });
    res.status(201).json({ success: true, data: copy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
