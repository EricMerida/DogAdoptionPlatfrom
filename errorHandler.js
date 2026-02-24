function notFound(req, res) {
  return res.status(404).json({ error: "Not found" });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || "Server error";
  return res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };