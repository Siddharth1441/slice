import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to generate Mongoose-like 24-char ObjectId
const generateId = () => {
  return [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
};

class MockModel {
  constructor(modelName) {
    this.modelName = modelName;
    this.filePath = path.join(DATA_DIR, `${modelName}.json`);
    
    // Seed initial data if file doesn't exist
    if (!fs.existsSync(this.filePath)) {
      this.write([]);
    }
  }

  read() {
    try {
      if (!fs.existsSync(this.filePath)) return [];
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content || '[]');
    } catch (err) {
      console.error(`Error reading mock db file for ${this.modelName}:`, err);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing mock db file for ${this.modelName}:`, err);
    }
  }

  // MOCK ACTIONS
  async countDocuments(query = {}) {
    const data = this.read();
    return this._filter(data, query).length;
  }

  async find(query = {}) {
    let data = this.read();
    data = this._filter(data, query);

    // Return object with Mongoose-like helper methods
    const self = this;
    const chain = {
      data,
      sort(sortObj) {
        const key = Object.keys(sortObj)[0];
        const dir = sortObj[key];
        data.sort((a, b) => {
          if (a[key] < b[key]) return dir === 1 ? -1 : 1;
          if (a[key] > b[key]) return dir === 1 ? 1 : -1;
          return 0;
        });
        return this;
      },
      skip(count) {
        this.data = this.data.slice(Number(count));
        return this;
      },
      limit(count) {
        this.data = this.data.slice(0, Number(count));
        return this;
      },
      // If used as a promise
      then(resolve) {
        resolve(this.data);
      }
    };
    return chain;
  }

  async findOne(query = {}) {
    const data = this.read();
    const filtered = this._filter(data, query);
    if (!filtered.length) return null;
    
    return this._wrapDocument(filtered[0]);
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(obj) {
    const data = this.read();
    const newDoc = {
      _id: generateId(),
      ...obj,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If User, pre-hash password
    if (this.modelName === 'User' && newDoc.password) {
      const salt = await bcrypt.genSalt(10);
      newDoc.password = await bcrypt.hash(newDoc.password, salt);
    }

    data.push(newDoc);
    this.write(data);
    return this._wrapDocument(newDoc);
  }

  async insertMany(arr) {
    const data = this.read();
    const createdDocs = [];

    for (const item of arr) {
      const newDoc = {
        _id: generateId(),
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.push(newDoc);
      createdDocs.push(newDoc);
    }

    this.write(data);
    return createdDocs.map(d => this._wrapDocument(d));
  }

  async findByIdAndUpdate(id, updateObj, options = {}) {
    const data = this.read();
    const idx = data.findIndex(d => d._id === id);
    if (idx === -1) return null;

    data[idx] = {
      ...data[idx],
      ...updateObj,
      updatedAt: new Date().toISOString()
    };

    this.write(data);
    return this._wrapDocument(data[idx]);
  }

  async findByIdAndDelete(id) {
    const data = this.read();
    const idx = data.findIndex(d => d._id === id);
    if (idx === -1) return null;

    const removed = data.splice(idx, 1)[0];
    this.write(data);
    return removed;
  }

  // MOCK AGGREGATION (specifically for sales reports)
  async aggregate(pipeline) {
    const data = this.read();
    
    // Only completed orders
    const completedOrders = data.filter(order => order.status === 'completed');

    // 1. Overall totals
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = completedOrders.length;

    // 2. Daily Sales
    const dailyMap = {};
    completedOrders.forEach(order => {
      const date = order.createdAt.split('T')[0];
      if (!dailyMap[date]) dailyMap[date] = { revenue: 0, count: 0 };
      dailyMap[date].revenue += order.totalAmount || 0;
      dailyMap[date].count += 1;
    });
    const dailySales = Object.keys(dailyMap).map(date => ({
      _id: date,
      revenue: dailyMap[date].revenue,
      count: dailyMap[date].count
    })).sort((a, b) => b._id.localeCompare(a._id));

    // 3. Monthly Sales
    const monthlyMap = {};
    completedOrders.forEach(order => {
      const month = order.createdAt.split('T')[0].substring(0, 7); // YYYY-MM
      if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, count: 0 };
      monthlyMap[month].revenue += order.totalAmount || 0;
      monthlyMap[month].count += 1;
    });
    const monthlySales = Object.keys(monthlyMap).map(month => ({
      _id: month,
      revenue: monthlyMap[month].revenue,
      count: monthlyMap[month].count
    })).sort((a, b) => b._id.localeCompare(a._id));

    // 4. Popular Items
    const itemsMap = {};
    completedOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const key = item.menuItem;
        if (!itemsMap[key]) {
          itemsMap[key] = {
            _id: key,
            name: item.name,
            quantitySold: 0,
            revenueGenerated: 0
          };
        }
        itemsMap[key].quantitySold += item.quantity || 0;
        itemsMap[key].revenueGenerated += (item.price || 0) * (item.quantity || 0);
      });
    });
    const popularItems = Object.keys(itemsMap).map(key => itemsMap[key])
      .sort((a, b) => b.quantitySold - a.quantitySold);

    // Return response tailored to what orderController expects
    // Based on the aggregation pipeline match
    const step = pipeline[0]?.$match;
    const isCompletedFilter = step && step.status === 'completed';

    if (pipeline.length === 2 && pipeline[1].$group && pipeline[1].$group._id === null) {
      // Overall totals request
      return [{ totalRevenue, totalOrders }];
    }
    
    // Check if grouping by date
    const groupField = pipeline[1]?.$group?._id?.$dateToString?.format;
    if (groupField === '%Y-%m-%d') {
      return dailySales;
    }
    if (groupField === '%Y-%m') {
      return monthlySales;
    }

    // Check if item Popularity (unwind at step 1)
    if (pipeline[1]?.$unwind === '$items') {
      return popularItems;
    }

    return [];
  }

  // HELPERS
  _filter(list, query) {
    return list.filter(item => {
      for (const key in query) {
        if (key === '$or') {
          const conditions = query[key];
          const matched = conditions.some(cond => {
            const condKey = Object.keys(cond)[0];
            const condVal = cond[condKey];
            if (condVal.$regex) {
              const reg = new RegExp(condVal.$regex, condVal.$options);
              return reg.test(item[condKey] || '');
            }
            return item[condKey] === condVal;
          });
          if (!matched) return false;
          continue;
        }

        if (key === 'status' && typeof query[key] === 'object' && query[key].$in) {
          if (!query[key].$in.includes(item[key])) return false;
          continue;
        }

        const val = query[key];
        if (val && typeof val === 'object' && val.$regex) {
          const reg = new RegExp(val.$regex, val.$options);
          if (!reg.test(item[key] || '')) return false;
        } else if (item[key] !== val) {
          return false;
        }
      }
      return true;
    });
  }

  _wrapDocument(doc) {
    if (!doc) return null;

    const self = this;
    return {
      ...doc,
      async save() {
        const data = self.read();
        const idx = data.findIndex(d => d._id === doc._id);
        
        // Custom pre-save hook for User password updates
        if (self.modelName === 'User' && this.password && (!data[idx] || data[idx].password !== this.password)) {
          // If password was updated and not hashed, hash it
          if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
          }
        }

        const updatedDoc = {
          ...this,
          updatedAt: new Date().toISOString()
        };

        if (idx === -1) {
          data.push(updatedDoc);
        } else {
          data[idx] = updatedDoc;
        }

        self.write(data);
        return updatedDoc;
      },
      async comparePassword(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      }
    };
  }
}

const mockModels = {};

export default function getModel(modelName, MongooseModel) {
  return new Proxy(MongooseModel, {
    get(target, prop, receiver) {
      // If database is connected, delegate to MongooseModel
      if (global.dbConnected) {
        return Reflect.get(target, prop, receiver);
      }

      // Fallback: load or reuse MockModel
      if (!mockModels[modelName]) {
        mockModels[modelName] = new MockModel(modelName);
      }

      const mock = mockModels[modelName];
      if (typeof mock[prop] === 'function') {
        return mock[prop].bind(mock);
      }

      return Reflect.get(mock, prop);
    }
  });
}
