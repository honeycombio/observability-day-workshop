"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_s3_1 = require("@aws-sdk/client-s3");
const api_1 = require("@opentelemetry/api");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 10118;
const BUCKET_NAME = process.env.BUCKET_NAME || 'random-pictures';
app.use(express_1.default.json());
app.get("/health", (req, res) => {
    res.send("OK");
});
app.get('/imageUrl', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    var _d;
    const s3Client = new client_s3_1.S3Client({ region: 'us-east-1' });
    const input = {
        Bucket: BUCKET_NAME,
    };
    const command = new client_s3_1.ListObjectsV2Command(input);
    const response = yield s3Client.send(command);
    const images = [];
    if (response.Contents) {
        try {
            for (var _e = true, _f = __asyncValues(response.Contents), _g; _g = yield _f.next(), _a = _g.done, !_a; _e = true) {
                _c = _g.value;
                _e = false;
                const image = _c;
                images.push(image.Key);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_e && !_a && (_b = _f.return)) yield _b.call(_f);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    const randomImage = choose(images);
    (_d = api_1.trace.getActiveSpan()) === null || _d === void 0 ? void 0 : _d.setAttributes({ "app.imageKey": randomImage });
    res.send({ imageKey: randomImage });
}));
function choose(array) {
    var _a;
    const i = Math.floor(Math.random() * array.length);
    (_a = api_1.trace.getActiveSpan()) === null || _a === void 0 ? void 0 : _a.setAttributes({ "app.choiceIndex": i, "app.numberOfChoices": array.length }); // INSTRUMENTATION: add relevant info
    return array[i];
}
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
