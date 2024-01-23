const express = require("express");
const Documents = require("../Schemas/Document");
const FetchUser = require("../middleware/FetchUser");
const router = express.Router();

router.get("/GetAll", FetchUser, async (req, res) => {
  try {
    const docs = await Documents.find({ UserID: req.user.id });
    return res.json(docs);
  } catch (error) {
    console.log(error);
    return res.status(420).json({ error: "DB Error" });
  }
});

router.post("/ChangeViewMode", FetchUser, async (req, res) => {
  const { viewMode, documentId } = req.body;

  if (!["private", "view", "edit"].includes(viewMode)) {
    return res.status(400).json({ error: "Invalid view mode" });
  }

  try {
    const document = await Documents.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.UserID.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized to edit this document" });
    }

    document.PrivacyMode = viewMode;
    await document.save();

    return res.json({ message: "View mode updated successfully", document });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "DB Error" });
  }
});

router.post("/RequestAccess", FetchUser, async (req, res) => {
  const { documentId } = req.body;

  try {
    const document = await Documents.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!document.Requests.includes(req.user.id)) {
      document.Requests.push(req.user.id);
      await document.save();
    }

    return res.json({ message: "Access request submitted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "DB Error" });
  }
});

router.get("/GetRequests", FetchUser, async (req, res) => {
  const documentId = req.header("documentId");

  try {
    const document = await Documents.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.UserID.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized to view requests for this document" });
    }

    return res.json({ requests: document.Requests });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "DB Error" });
  }
});

router.post("/AddEditor", FetchUser, async (req, res) => {
  const { documentId, userIdToAdd } = req.body;

  try {
    const document = await Documents.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.UserID.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized to modify permissions for this document" });
    }

    document.Requests = document.Requests.filter(id => id.toString() !== userIdToAdd.toString());
    if (!document.EditPermission.includes(userIdToAdd)) {
      document.EditPermission.push(userIdToAdd);
    }

    await document.save();

    return res.json({ message: "User added as editor successfully", document });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "DB Error" });
  }
});

router.post("/AddViewer", FetchUser, async (req, res) => {
  const { documentId, userIdToAdd } = req.body;

  try {
    const document = await Documents.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.UserID.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized to modify permissions for this document" });
    }

    document.Requests = document.Requests.filter(id => id.toString() !== userIdToAdd.toString());
    if (!document.ViewPermission.includes(userIdToAdd)) {
      document.ViewPermission.push(userIdToAdd);
    }

    await document.save();

    return res.json({ message: "User added as viewer successfully", document });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "DB Error" });
  }
});

module.exports = router;
