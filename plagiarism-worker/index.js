const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const Parser = require("tree-sitter");
const C = require("tree-sitter-c");
const Cpp = require("tree-sitter-cpp");
const CSharp = require("tree-sitter-c-sharp");
const Java = require("tree-sitter-java");
const Python = require("tree-sitter-python");
const Go = require("tree-sitter-go");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());
app.use(morgan("dev"));

const languageMap = {
  50: C,
  51: CSharp,
  52: Cpp,
  53: Cpp,
  54: Cpp,
  62: Java,
  70: Python,
  71: Python,
  60: Go,
};

function traversePostOrder(node, tokens) {
  if (!node) return;
  for (let child of node.children) {
    traversePostOrder(child, tokens);
  }
  // Only add named structural nodes (ignore generic punctuation)
  if (node.isNamed && node.type !== "comment") {
    tokens.push(node.type);
  }
}

app.post("/api/tokenize/batch", (req, res) => {
  try {
    const requests = req.body; // Array of { id, code, languageId }
    if (!Array.isArray(requests)) {
      return res.status(400).json({ error: "Expected an array of requests" });
    }

    const parser = new Parser();
    const results = {};

    for (const item of requests) {
      const { id, code, languageId } = item;
      if (!id || !code) continue;

      const lang = languageMap[languageId] || C;
      parser.setLanguage(lang);

      const tree = parser.parse(code);
      const tokens = [];
      traversePostOrder(tree.rootNode, tokens);

      results[id] = tokens.join(" ");
    }

    res.json(results);
  } catch (err) {
    console.error("Batch tokenization error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Plagiarism Worker running on port ${PORT}`);
});
