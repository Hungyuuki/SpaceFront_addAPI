"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_store_1 = __importDefault(require("electron-store"));
const axiosConfig_1 = __importDefault(require("./axiosConfig"));
const fs_1 = __importDefault(require("fs"));
const form_data_1 = __importDefault(require("form-data"));
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const sound_play_1 = __importDefault(require("sound-play"));
const socket = (0, socket_io_client_1.default)('https://voichat.herokuapp.com/');
require('dotenv').config();
const store = new electron_store_1.default();
const getFilePath = (filePath) => {
    return path.join(__dirname, "../" + filePath);
};
const firebaseApp = require("./firestore");
let check;
function createWindow() {
    // Create the browser window.
    const mainWindow = new electron_1.BrowserWindow({
        width: 380,
        height: 800,
        // titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        webPreferences: {
            webviewTag: true,
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js")
        }
    });
    let screenSize = mainWindow.getBounds();
    // Router
    // and load the index.html of the app.
    if (store.get('is_login')) {
        mainWindow.loadFile(getFilePath("public/html/login.html"));
    }
    else {
        mainWindow.loadFile(getFilePath("public/html/homePage.html"));
    }
    electron_1.ipcMain.handle('login-form', (event, arg) => __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (reject) {
            mainWindow.loadFile(getFilePath("public/html/login.html"));
        });
    }));
    // Login if user already in
    // if (store.get('refreshToken') && store.get('uid')) {
    //   mainWindow.loadFile(getFilePath("public/html/homePage.html"))
    //   initApp()
    // }
    socket.on('leave-room', (data) => {
        store.set('on_event', data);
    });
    socket.on('join-room', (data) => {
        if (data.changeNewRoom) {
            if (data.floor_id != store.get('floorId')) {
                store.set('change-room', data);
            }
        }
        if (data.floor_id == store.get('floorId') || data.floor_id == store.get('current_floor')) {
            store.set('on_event', data);
        }
        // handle action to another user in same room
        if (data.room_id === store.get('room_id') && data.uid !== store.get('uid')) {
            sound_play_1.default.play(getFilePath('/public/static/clientJoinRoom.wav'));
        }
    });
    socket.on('change-avatar', data => {
        store.set('on_event', data);
    });
    socket.on('change-status-mic', data => {
        if (store.get('userId') != data.userId) {
            store.set('on_event', data);
        }
    });
    socket.on('change-status-speaker', data => {
        if (store.get('userId') != data.userId) {
            store.set('on_change_speaker', data);
        }
    });
    socket.on('change-login-status', data => {
        if (store.get('floorId') == data.floor_id) {
            store.set('on_event', data);
        }
    });
    socket.on('create-new-room', data => {
        if (store.get('floorId') == data.floor_id) {
            store.set('on_event', data);
        }
    });
    socket.on('create-new-floor', data => {
        store.set('on_event', data);
    });
    socket.on('change-name', (data) => {
        if (store.get('floorId') == data.floorId) {
            store.set('on_event', data);
        }
    });
    socket.on('remove-room', data => {
        console.log(data);
        if (store.get('floorId') == data.floor_id) {
            store.set('on-remove-event', data);
        }
    });
    socket.on('remove-floor', (data) => {
        console.log('Onevent', data);
        store.set('on-remove-event', data);
    });
    electron_1.ipcMain.handle("success-verify", () => {
        return mainWindow.loadFile(getFilePath("public/html/successVerifyEmail.html"));
    });
    electron_1.ipcMain.handle('sign-in-form', (event, arg) => __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (reject) {
            mainWindow.loadFile(getFilePath("public/html/signUp.html"));
        });
    }));
    electron_1.ipcMain.handle('log-out', () => __awaiter(this, void 0, void 0, function* () {
        store.delete("is_join");
        return new Promise(function () {
            mainWindow.loadFile(getFilePath("public/html/login.html"));
        });
    }));
    electron_1.ipcMain.handle('verify-email-form', (event, arg) => __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (reject) {
            mainWindow.loadFile(getFilePath("public/html/verifyEmail.html"));
        });
    }));
    electron_1.ipcMain.handle('home-page', (event, arg) => __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            mainWindow.loadFile(getFilePath("public/html/homePage.html"));
        });
    }));
    electron_1.ipcMain.handle('set-window-on-top', () => {
        mainWindow.setAlwaysOnTop(true);
        mainWindow.setFullScreenable(false);
    });
    electron_1.ipcMain.handle('get-screen-size', () => {
        return screenSize.width, screenSize.height;
    });
    electron_1.ipcMain.handle('set-window-off-top', (event, arg) => __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            mainWindow.setAlwaysOnTop(false, "screen-saver");
        });
    }));
    electron_1.ipcMain.handle('set-audio-off', (event, arg) => __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            mainWindow.webContents.setAudioMuted(true);
        });
    }));
    electron_1.ipcMain.handle('set-audio-on', (event, arg) => __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            mainWindow.webContents.setAudioMuted(false);
        });
    }));
    electron_1.ipcMain.handle('leaveRoom', (event, arg) => __awaiter(this, void 0, void 0, function* () {
        if (store.get('is_join_room')) {
            yield leaveRoom();
        }
    }));
    electron_1.ipcMain.on("close-window", (e) => __awaiter(this, void 0, void 0, function* () {
        yield leaveRoom();
        mainWindow.close();
    }));
    electron_1.ipcMain.on("reloadMainWindow", e => {
        mainWindow.reload();
    });
    electron_1.ipcMain.handle('minimize-window', () => {
        return mainWindow.minimize();
    });
    // Invisible menu bar
    // mainWindow.setMenuBarVisibility(false)
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
    //Modal
    const modalWindow = (filePath, width, height) => {
        let modal = new electron_1.BrowserWindow({
            parent: mainWindow,
            modal: true,
            width: width !== null && width !== void 0 ? width : 330,
            height: height !== null && height !== void 0 ? height : 200,
            frame: false,
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, "preload.js")
            }
        });
        modal.setPosition(mainWindow.getPosition()[0], mainWindow.getPosition()[1] + 200);
        modal.loadFile(filePath);
        return modal;
    };
    electron_1.ipcMain.on("open-room-create", e => {
        const modal = modalWindow(getFilePath("public/html/createRoomModal.html"), 330, 280);
        // modal.webContents.openDevTools()
        modal.once("ready-to-show", () => {
            modal.show();
        });
        electron_1.ipcMain.on("close-modal", e => {
            console.log('close modal');
            modal.destroy();
        });
    });
    electron_1.ipcMain.handle("open-upload-image", e => {
        return electron_1.dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "gif"] }]
        }).then(({ canceled, filePaths }) => {
            if (canceled) {
                return false;
            }
            let img = fs_1.default.createReadStream(filePaths[0]);
            let data = new form_data_1.default();
            data.append("photos", img);
            data.append("company_id", store.get('company_id'));
            return axiosConfig_1.default.post("/room_icons", data)
                .then(function (response) {
                return response.data;
            })
                .catch(function (error) {
                return false;
            });
        }).catch(err => {
            // handle error
        });
    });
    electron_1.ipcMain.handle("changeName", (event, data) => __awaiter(this, void 0, void 0, function* () {
        data = {
            onamae: data
        };
        let uid = store.get('uid');
        socket.emit('change-name', {
            userId: store.get('userId'),
            username: data.onamae,
            floor_id: store.get('floorId'),
            isChangeName: true
        });
        return axiosConfig_1.default.post(`users/changeName/${uid}`, data).then(function (res) {
            return true;
        }).catch((error) => {
            return false;
        });
    }));
    electron_1.ipcMain.handle("getActiveRoomUsersByFloorId", (event, data) => __awaiter(this, void 0, void 0, function* () {
        return axiosConfig_1.default.get(`/room_users/active/floor/${data}`)
            .then(function (response) {
            return convertObjecttoArry(response.data.room_users);
        })
            .catch(function (error) {
            check = "error";
            return check;
        });
    }));
    electron_1.ipcMain.handle("open-upload-avatar", e => {
        return electron_1.dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "gif"] }]
        }).then(({ canceled, filePaths }) => {
            if (canceled) {
                return false;
            }
            return filePaths[0];
        }).catch(err => {
            return false;
        });
    });
    electron_1.ipcMain.handle("update-user-avatar", (event, filePath) => __awaiter(this, void 0, void 0, function* () {
        if (filePath.split(',')[0] === 'data:image/png;base64') {
            let fileData = filePath.split(',')[1];
            let dirPath = getFilePath("/camera");
            filePath = getFilePath("/camera/" + Date.now() + ".jpg");
            if (!fs_1.default.existsSync(dirPath)) {
                fs_1.default.mkdirSync(dirPath);
            }
            yield fs_1.default.writeFile(filePath, fileData, { encoding: 'base64' }, function (err) {
                return true;
            });
        }
        return yield updateAvatar(filePath);
    }));
    electron_1.ipcMain.on("open-confirm-modal", e => {
        const modal = modalWindow(getFilePath("public/html/confirmModal.html"));
        // modal.webContents.openDevTools()
        modal.once("ready-to-show", () => {
            modal.show();
        });
        electron_1.ipcMain.on("close-modal", e => {
            modal.destroy();
        });
    });
    electron_1.ipcMain.handle("show-confirm-modal", (e, data) => {
        if (!data.isRemoveFloor) {
            store.set('number-users', data.numberUsers ? 0 : 1);
        }
        store.set('remove-data', data);
        const modal = modalWindow(getFilePath("public/html/confirmRemove.html"));
        modal.once("ready-to-show", () => {
            modal.show();
        });
        electron_1.ipcMain.on("close-modal", e => {
            modal.destroy();
        });
    });
    //End Modal
}
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on("activate", function () {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on("window-all-closed", () => __awaiter(void 0, void 0, void 0, function* () {
    // if (process.platform !== "darwin") {
    // }
    yield leaveRoom();
    electron_1.app.quit();
}));
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
const convertObjecttoArry = (data) => {
    return Object.keys(data).map((i) => {
        let dataArray = data[i];
        return dataArray;
    });
};
let userId;
electron_1.ipcMain.handle("get-user-id", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(function (resolve, reject) {
        userId = store.get("userId");
        return resolve(userId);
    });
}));
electron_1.ipcMain.handle("createUser", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return axiosConfig_1.default.post("/users", data)
        .then(function (response) {
        store.set('userId', response.data.id);
        check = "Done";
        return check;
    })
        .catch(function (error) {
        check = error.response.data.message;
        return check;
    });
}));
electron_1.ipcMain.handle("verifyRegisterCode", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return axiosConfig_1.default.post("/users/verifyRegisterCode", data)
        .then(function (response) {
        check = "Done";
        return check;
    })
        .catch(function (error) {
        check = "error";
        return check;
    });
}));
electron_1.ipcMain.handle("getFloor", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    let company_id = store.get('company_id');
    store.set('current_floor', data.floor_id);
    if (company_id == "" || company_id == null || company_id == undefined) {
        company_id = data.company_id;
    }
    return axiosConfig_1.default.get(`/floors/active/${company_id}`)
        .then(function (response) {
        let data = {
            floors: convertObjecttoArry(response.data)
        };
        return data;
    })
        .catch(function (error) {
        check = "error";
        return check;
    });
}));
electron_1.ipcMain.handle("getUsersById", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return axiosConfig_1.default.get(`/users/${data}`)
        .then(function (response) {
        return response.data.user;
    })
        .catch(function (error) {
        check = "error";
        return check;
    });
}));
electron_1.ipcMain.handle("getFristFloorOfCompany", (event, companyId) => __awaiter(void 0, void 0, void 0, function* () {
    return axiosConfig_1.default.get(`/floors/active/${companyId}`)
        .then(function (response) {
        return convertObjecttoArry(response.data.floors)[0].id;
    })
        .catch(function (error) {
        check = "error";
        return check;
    });
}));
electron_1.ipcMain.handle("getRoomsByStatusAndFloorId", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return axiosConfig_1.default.get(`/rooms/active/${data}`)
        .then(function (response) {
        check = "Done";
        return {
            rooms: convertObjecttoArry(response.data)
        };
    })
        .catch(function (error) {
        check = "error";
        return check;
    });
}));
electron_1.ipcMain.handle("/room_icons/active", (event, company_id) => __awaiter(void 0, void 0, void 0, function* () {
    company_id = store.get('company_id');
    return axiosConfig_1.default.get(`/room_icons/active/${company_id}`)
        .then(function (response) {
        check = "Done";
        let data = {
            room_icons: convertObjecttoArry(response.data)
        };
        return data;
    })
        .catch(function (error) {
        check = "error";
        return check;
    });
}));
electron_1.ipcMain.handle("addFloor", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    let dataNew = {
        company_id: store.get('company_id'),
        name: data.name,
        created_user: store.get('userId')
    };
    return axiosConfig_1.default.post(`/floors`, dataNew)
        .then(function (response) {
        check = "Done";
        socket.emit('create-new-floor', {
            userId: store.get('userId'),
            username: store.get('userName'),
            name: data.name,
            isCreateFloor: true,
            floor_id: response.data.floor_id,
            old_floor_id: store.get('floorId'),
        });
        return response.data;
    })
        .catch(function (error) {
        check = "error";
        return check;
    });
}));
electron_1.ipcMain.handle("/room_icons", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return axiosConfig_1.default.post(`/room_icons`, data)
        .then(function (response) {
        check = "Done";
        return response.data;
    })
        .catch(function (error) {
        check = "error";
        return check;
    });
}));
electron_1.ipcMain.handle("storeSet", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return store.set(data);
}));
electron_1.ipcMain.handle("storeGet", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return store.get(data);
}));
electron_1.ipcMain.handle("storeDelete", (event, key) => __awaiter(void 0, void 0, void 0, function* () {
    return store.delete(key);
}));
electron_1.ipcMain.handle("login", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(function (resolve, reject) {
        const signIn = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield firebaseApp.authenticate(data.email, data.password);
                store.set('uid', user.user.uid);
                let companyId = getCompanyId(user.user.uid);
                store.set('token', user._tokenResponse.idToken);
                store.set('refreshToken', user._tokenResponse.refreshToken);
                axiosConfig_1.default.defaults.headers.common['Authorization'] = 'Bearer ' + user._tokenResponse.idToken;
                return companyId;
            }
            catch (err) {
                return "err";
            }
        });
        signIn();
        initApp();
        return resolve(signIn());
    });
}));
const getCompanyId = (uid) => {
    return axiosConfig_1.default.get(`/users/getCompanyId/${uid}`)
        .then(function (response) {
        store.set('userId', response.data.users[0].id);
        store.set('company_id', response.data.users[0].company_id);
        return response.data.users[0].company_id;
    })
        .catch(function (error) {
        return error;
    });
};
electron_1.ipcMain.handle("get-users-company", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    let company_id = store.get('company_id');
    return axiosConfig_1.default.get(`/users/active/${company_id}`)
        .then(function (response) {
        check = "Done";
        let data = {
            users_company: convertObjecttoArry(response.data)
        };
        return data;
    })
        .catch(function (error) {
        check = "error";
        return check;
    });
}));
electron_1.ipcMain.handle("/rooms", (e, data) => __awaiter(void 0, void 0, void 0, function* () {
    data.floor_id = store.get('floorId');
    data.created_user = store.get('userId');
    return axiosConfig_1.default.post(`/rooms`, data)
        .then(function (response) {
        var _a, _b;
        check = "Done";
        store.set('room_id', response.data.room_id);
        // emit event create new room for other users at the same floor
        socket.emit('create-new-room', {
            floor_id: data.floor_id,
            room_id: response.data.room_id,
            room_name: data.name,
            icon_images: (_a = store.get('icon_images')) !== null && _a !== void 0 ? _a : store.get('default_icon_images'),
            isCreateRoom: true,
            room_icon_id: (_b = data.room_icon_id) !== null && _b !== void 0 ? _b : store.get('default_icon_id'),
            username: store.get('userName')
        });
        return response.data;
    })
        .catch(function (error) {
        check = "error";
        return check;
    });
}));
// Change status mic, speaker
electron_1.ipcMain.handle("get-status-mic", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(function (resolve, reject) {
        let statusMic = store.get('status_mic');
        return resolve(statusMic);
    });
}));
electron_1.ipcMain.handle("get-status-speaker", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(function (resolve, reject) {
        let statusSpeaker = store.get('status_speaker');
        return resolve(statusSpeaker);
    });
}));
electron_1.ipcMain.handle("change-status-mic", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    let uid = store.get('uid');
    if (store.get("is_join_room")) {
        socket.emit('change-status-mic', {
            userId: store.get('userId'),
            isChangeMic: true,
            username: store.get('userName'),
        });
    }
    return axiosConfig_1.default.post(`/users/updateMicStatus/${uid}`)
        .then(function (response) {
        store.set('status_mic', response.data.result[0].is_mic);
        return response.data;
    })
        .catch(function (error) {
        return "error";
    });
}));
electron_1.ipcMain.handle("change-status-speaker", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    let uid = store.get('uid');
    if (store.get("is_join_room")) {
        socket.emit('change-status-speaker', {
            userId: store.get('userId'),
            isChangeSpeaker: true,
            username: store.get('userName'),
        });
    }
    return axiosConfig_1.default.post(`/users/updateSpeakerStatus/${uid}`)
        .then(function (response) {
        store.set('status_speaker', response.data.result[0].is_speaker);
        return response.data;
    })
        .catch(function (error) {
        return error;
    });
}));
electron_1.ipcMain.handle("channel-Agora", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    let dataChannel = store.get('dataChannel');
    return new Promise(function (resolve, reject) {
        return resolve(dataChannel);
    });
}));
electron_1.ipcMain.handle("change-room", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (store.get('old_room') == data.room_id) {
        return "Not_changed";
    }
    else {
        if (store.get('old_room')) {
            if (store.get('old_room') != data.room_id) {
                data.changeNewRoom = true;
            }
        }
        store.set('old_room', data.room_id);
        data.username = store.get('userName');
        data.userAvatar = store.get('userAvatar');
        data.uid = store.get('uid');
        sound_play_1.default.play(getFilePath('public/static/joinRoom.wav'));
        socket.emit('join-room', data);
        store.set('is_join_room', true);
        let uid = store.get('uid');
        store.set('room_id', data.room_id);
        store.set('status_mic', '0');
        store.set('floorId', data.floor_id);
        let dataNew = {
            uid: uid,
            room_id: data.room_id
        };
        return axiosConfig_1.default.post(`/room_users/changeRoom`, dataNew)
            .then(function (response) {
            store.set('dataChannel', response.data.result);
            return response.data.result;
        })
            .catch(function (error) {
            return "error";
        });
    }
}));
electron_1.ipcMain.handle("update-room-voices", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    let dataRoomVoice = {
        room_id: store.get('room_id')
    };
    return axiosConfig_1.default.post(`/room_voices/updateRoomVoice`, dataRoomVoice)
        .then(function (response) {
        return response.data;
    })
        .catch(function (error) {
        return "error";
    });
}));
const leaveRoom = () => {
    let data = {
        uid: store.get('uid')
    };
    store.delete('old_room');
    store.delete('is_join_room');
    socket.emit('leave-room', {
        room_id: store.get('room_id'),
        floor_id: store.get('floorId'),
        username: store.get('userName'),
        userId: store.get('userId'),
        leave: true
    });
    store.delete('room_id');
    return axiosConfig_1.default.post("/room_users/leaveRoom", data).then(() => {
        return true;
    }).catch(() => {
        return false;
    });
};
const getUserInfo = (id) => {
    return axiosConfig_1.default.get(`users/${id}`).then((res) => {
        return res.data;
    }).catch((error) => {
        return error.data;
    });
};
electron_1.ipcMain.handle('getCurrentAvatar', (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return axiosConfig_1.default.get(`users/${store.get('userId')}`).then((res) => {
        store.set({
            userAvatar: res.data.user.avatar,
            userName: res.data.user.onamae
        });
        return res.data.user.avatar;
    }).catch((error) => {
        return error.data;
    });
}));
electron_1.ipcMain.handle('getCurrentName', (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return axiosConfig_1.default.get(`users/${store.get('userId')}`).then((res) => {
        store.set({ userName: res.data.user.onamae });
        return res.data.user.onamae;
    }).catch((error) => {
        return error.data;
    });
}));
electron_1.ipcMain.handle('remove-room', (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    const uids = data.uids.replace('[', '').replace(']', '').split(',');
    axiosConfig_1.default.delete(`rooms/${data.room_id}`)
        .then((res) => {
        socket.emit('remove-room', {
            userId: store.get('userId'),
            username: store.get('userName'),
            room_id: data.room_id,
            floor_id: store.get('floorId'),
            uids: data.numberUsers ? uids : [],
            isRemoveRoom: true
        });
    });
    if (data.numberUsers > 0) {
        Promise.all(uids.map((uid) => axiosConfig_1.default.post("/room_users/leaveRoom", { uid: uid })));
    }
}));
electron_1.ipcMain.handle('remove-floor', (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(data);
    Promise.all([
        axiosConfig_1.default.delete(`floors/${data.floor_id}`),
        axiosConfig_1.default.get(`/room_users/active/floor/${data.floor_id}`)
    ]).then((response) => {
        const [isRemoved, result] = response;
        const users = convertObjecttoArry(result.data.room_users);
        const uids = users.map((user) => user.uid);
        socket.emit('remove-floor', {
            floor_id: data.floor_id,
            uids: uids,
            isRemoveFloor: true
        });
        Promise.all(uids.map((uid) => axiosConfig_1.default.post("/room_users/leaveRoom", { uid: uid })));
    });
}));
const setCurrentUserInfo = () => {
    getUserInfo(store.get('userId'))
        .then((res) => {
        store.set({
            userAvatar: res.user.avatar,
            userName: res.user.onamae
        });
    })
        .catch((error) => {
    });
};
function initApp() {
    return __awaiter(this, void 0, void 0, function* () {
        yield getCompanyId(store.get('uid'));
        yield setCurrentUserInfo();
    });
}
const updateAvatar = (filePaths, is_base64) => {
    let img = fs_1.default.createReadStream(filePaths);
    let data = new form_data_1.default();
    data.append("photos", img);
    data.append("uid", store.get('uid'));
    return axiosConfig_1.default.post(`/users/changeAvatar/${store.get('uid')}`, data)
        .then(function (response) {
        if (store.get('is_join_room')) {
            socket.emit('change-avatar', {
                userId: store.get('userId'),
                username: store.get('userName'),
                changeAvatar: true,
                userAvatar: response.data.avatar
            });
        }
        return [response.status.toString(), response.data.avatar];
    })
        .catch(function (error) {
        return [error.response.status, error.response.data.message];
    });
};
electron_1.ipcMain.handle("change-login-status", (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    socket.emit('change-login-status', {
        userId: store.get('userId'),
        username: store.get('userName'),
        floor_id: store.get('floorId'),
        isChangeStatusLogin: true,
        status: data.login_status,
        isPhoneStatus: data.login_status == 1 ? true : false
    });
    return axiosConfig_1.default.post(`/users/changeLoginStatus/${store.get('uid')}`, data)
        .then(function (response) {
        check = "Done";
        return check;
    })
        .catch(function (error) {
        check = error.response.data.message;
        return check;
    });
}));
//# sourceMappingURL=main.js.map