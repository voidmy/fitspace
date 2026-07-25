const fs = require("node:fs/promises");
const path = require("node:path");

class JsonStore {
  constructor(filePath, fallbackValue) {
    this.filePath = filePath;
    this.fallbackValue = fallbackValue;
    this.writeQueue = Promise.resolve();
    this.ready = null;
  }

  async init() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      try {
        await fs.access(this.filePath);
      } catch {
        await this.atomicWrite(this.fallbackValue);
      }
    })();
    return this.ready;
  }

  async read() {
    await this.init();
    const content = await fs.readFile(this.filePath, "utf8");
    try {
      return JSON.parse(content);
    } catch (error) {
      error.message = `无法解析 JSON 文件 ${this.filePath}: ${error.message}`;
      throw error;
    }
  }

  async write(value) {
    await this.init();
    this.writeQueue = this.writeQueue.then(async () => {
      await this.atomicWrite(value);
      return value;
    });
    return this.writeQueue;
  }

  async update(updater) {
    await this.init();
    this.writeQueue = this.writeQueue.then(async () => {
      const current = await this.read();
      const next = await updater(current);
      await this.atomicWrite(next);
      return next;
    });
    return this.writeQueue;
  }

  async atomicWrite(value) {
    const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    const content = `${JSON.stringify(value, null, 2)}\n`;
    await fs.writeFile(tempPath, content, "utf8");
    await fs.rename(tempPath, this.filePath);
  }
}

module.exports = { JsonStore };
