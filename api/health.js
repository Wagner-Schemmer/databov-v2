module.exports = (req, res) => {
  res.status(200).json({ ok: true, service: "databov-v2", time: new Date().toISOString() });
};
