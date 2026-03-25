const Contact = require('../models/Contact');

// ── GET /api/contacts ─────────────────────────────────────────────────────────
exports.getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 25, search, tag, list, subscribed } = req.query;
    const filter = { owner: req.user._id, isActive: true };

    if (search) filter.$text = { $search: search };
    if (tag)  filter.tags  = tag;
    if (list) filter.lists = list;
    if (subscribed !== undefined) filter.emailSubscribed = subscribed === 'true';

    const total = await Contact.countDocuments(filter);
    const contacts = await Contact.find(filter)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: contacts, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/contacts/:id ─────────────────────────────────────────────────────
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, owner: req.user._id });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/contacts ────────────────────────────────────────────────────────
exports.createContact = async (req, res) => {
  try {
    const contact = await Contact.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: contact });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: 'Contact already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/contacts/:id ─────────────────────────────────────────────────────
exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/contacts/:id ──────────────────────────────────────────────────
exports.deleteContact = async (req, res) => {
  try {
    await Contact.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false }
    );
    res.json({ success: true, message: 'Contact removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/contacts/bulk-import ───────────────────────────────────────────
exports.bulkImport = async (req, res) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0)
      return res.status(400).json({ success: false, message: 'No contacts provided' });

    const docs = contacts.map((c) => ({ ...c, owner: req.user._id, source: 'import' }));
    const result = await Contact.insertMany(docs, { ordered: false });
    res.json({ success: true, imported: result.length, message: `${result.length} contacts imported` });
  } catch (err) {
    const inserted = err.result?.nInserted || 0;
    res.json({ success: true, imported: inserted, errors: err.writeErrors?.length || 0 });
  }
};

// ── GET /api/contacts/tags ────────────────────────────────────────────────────
exports.getAllTags = async (req, res) => {
  try {
    const tags = await Contact.distinct('tags', { owner: req.user._id });
    res.json({ success: true, data: tags });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/contacts/lists ───────────────────────────────────────────────────
exports.getAllLists = async (req, res) => {
  try {
    const lists = await Contact.distinct('lists', { owner: req.user._id });
    res.json({ success: true, data: lists });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
