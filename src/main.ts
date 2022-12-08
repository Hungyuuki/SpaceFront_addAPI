import { app, BrowserWindow, dialog, ipcMain, powerSaveBlocker } from "electron";
import * as path from "path";
import Storage from "electron-store";
import axiosIns from "./axiosConfig";
import fs from "fs";
import FormData from "form-data";
import io from 'socket.io-client';
import sound from 'sound-play';
import { async } from "@firebase/util";
import { ThumbImageBuffer } from "agora-electron-sdk";

const socket = io('https://voichat.herokuapp.com/');
require('dotenv').config()
const store = new Storage()

const getFilePath = (filePath: string) => {
  return path.join(__dirname, "../" + filePath)
}

const firebaseApp = require("./firestore");

let check: string;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
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

  let screenSize = mainWindow.getBounds()
  // Router
  // and load the index.html of the app.
  if(store.get('is_login')) {
    mainWindow.loadFile(getFilePath("public/html/login.html"));
  } else {
    mainWindow.loadFile(getFilePath("public/html/homePage.html"));
  }

  ipcMain.handle('login-form', async (event, arg) => {
    return new Promise(function (reject) {
      mainWindow.loadFile(getFilePath("public/html/login.html"));
    });
  });

  // Login if user already in
  // if (store.get('refreshToken') && store.get('uid')) {
  //   mainWindow.loadFile(getFilePath("public/html/homePage.html"))
  //   initApp()
  // }

  socket.on('leave-room', (data) => {
    store.set('on_event', data);
  })

  socket.on('join-room', (data) => {
    if (data.changeNewRoom) {
      if(data.floor_id != store.get('floorId')) {
        store.set('change-room', data);
      }
    }
    if (data.floor_id == store.get('floorId') || data.floor_id == store.get('current_floor')) {
      store.set('on_event', data);
    }

    // handle action to another user in same room
    if (data.room_id === store.get('room_id') && data.uid !== store.get('uid')) {
      sound.play(getFilePath('/public/static/clientJoinRoom.wav'))
    }
  })

  socket.on('change-avatar', data => {
    store.set('on_event', data);
  })

  socket.on('change-status-mic', data => {
    if(store.get('userId') != data.userId) {
      store.set('on_event', data);
    }
  })

  socket.on('change-status-speaker', data => {
    if(store.get('userId') != data.userId) {
      store.set('on_change_speaker', data);
    }
  })

  socket.on('change-login-status', data => {
    if(store.get('floorId') == data.floor_id) {
      store.set('on_event', data);
    }
  })

  socket.on('create-new-room', data => {
    if(store.get('floorId') == data.floor_id) {
      store.set('on_event', data);
    }
  });

  socket.on('create-new-floor', data => {
      store.set('on_event', data);
  });

  socket.on('change-name', (data) => {
    if(store.get('floorId') == data.floorId) {
      store.set('on_event', data);
    }
  })

  socket.on('remove-room', data => {
    console.log(data);
    if(store.get('floorId') == data.floor_id) {
      store.set('on-remove-event', data);
    }
  })

  socket.on('remove-floor', (data) => {
    console.log('Onevent', data);
    store.set('on-remove-event', data);
  })

  ipcMain.handle("success-verify", () => {
    return mainWindow.loadFile(getFilePath("public/html/successVerifyEmail.html"));
  })

  ipcMain.handle('sign-in-form', async (event, arg) => {
    return new Promise(function (reject) {
      mainWindow.loadFile(getFilePath("public/html/signUp.html"));
    });
  });

  ipcMain.handle('log-out', async () => {
    store.delete("is_join")
    return new Promise(function () {
      mainWindow.loadFile(getFilePath("public/html/login.html"));
    });
  })

  ipcMain.handle('verify-email-form', async (event, arg) => {
    return new Promise(function (reject) {
      mainWindow.loadFile(getFilePath("public/html/verifyEmail.html"));
    });
  });

  ipcMain.handle('home-page', async (event, arg) => {
    return new Promise(function (resolve, reject) {
      mainWindow.loadFile(getFilePath("public/html/homePage.html"));
    });
  });

  ipcMain.handle('set-window-on-top', () => {
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setFullScreenable(false);
  });

  ipcMain.handle('get-screen-size', () => {
    return screenSize.width , screenSize.height
  })

  ipcMain.handle('set-window-off-top', async (event, arg) => {
    return new Promise(function (resolve, reject) {
      mainWindow.setAlwaysOnTop(false, "screen-saver");
    });
  });

  ipcMain.handle('set-audio-off', async (event, arg) => {
    return new Promise(function (resolve, reject) {
      mainWindow.webContents.setAudioMuted(true);
    });
  });

  ipcMain.handle('set-audio-on', async (event, arg) => {
    return new Promise(function (resolve, reject) {
      mainWindow.webContents.setAudioMuted(false);
    });
  });

  ipcMain.handle('leaveRoom', async (event, arg) => {
    if (store.get('is_join_room')) {
      await leaveRoom()
    }
  })

  ipcMain.on("close-window", async e => {
    await leaveRoom()
    mainWindow.close();
  })

  ipcMain.on("reloadMainWindow", e => {
    mainWindow.reload()
  })

  ipcMain.handle('minimize-window', () => {
    return mainWindow.minimize();
  });

  // Invisible menu bar
  // mainWindow.setMenuBarVisibility(false)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  //Modal
  const modalWindow = (filePath: string, width?: number, height?: number) => {
    let modal = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      width: width ?? 330,
      height: height ?? 200,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        preload: path.join(__dirname, "preload.js")
      }
    });
    modal.setPosition(mainWindow.getPosition()[0], mainWindow.getPosition()[1] + 200)
    modal.loadFile(filePath);
    return modal
  }

  ipcMain.on("open-room-create", e => {
    const modal = modalWindow(getFilePath("public/html/createRoomModal.html"), 330, 280);
    // modal.webContents.openDevTools()
    modal.once("ready-to-show", () => {
      modal.show();
    });

    ipcMain.on("close-modal", e => {
      console.log('close modal')
      modal.destroy();
    });
  })

  ipcMain.handle("open-upload-image", e => {
    return dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{name: "Image", extensions: ["png", "jpg", "jpeg", "gif"]}]
    }).then(({canceled, filePaths}) => {
      if (canceled) {
        return false
      }
      let img = fs.createReadStream(filePaths[0])
      let data = new FormData()
      data.append("photos", img)
      data.append("company_id", store.get('company_id'))

      return axiosIns.post("/room_icons", data)
        .then(function (response: any) {
          return response.data
        })
        .catch(function (error: any) {
          return false
        });

    }).catch(err => {
      // handle error
    });
  });

  ipcMain.handle("changeName", async (event, data) => {
    data = {
      onamae: data
    }
    let uid = store.get('uid');
    socket.emit('change-name', {
      userId: store.get('userId'),
      username: data.onamae,
      floor_id: store.get('floorId'),
      isChangeName: true
    });
    return axiosIns.post(`users/changeName/${uid}`, data).then(function (res: any) {
      return true
    }).catch((error: any) => {
      return false
    })
  })

  ipcMain.handle("getActiveRoomUsersByFloorId", async (event, data) => {
    return axiosIns.get(`/room_users/active/floor/${data}`)
    .then(function (response: any) {      
      return convertObjecttoArry(response.data.room_users)
    })
    .catch(function (error: any) {
      check = "error";
      return check
    });
  })

  ipcMain.handle("open-upload-avatar", e => {
    return dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{name: "Image", extensions: ["png", "jpg", "jpeg", "gif"]}]
    }).then(({canceled, filePaths}) => {
      if (canceled) {
        return false
      }
      return filePaths[0]
    }).catch(err => {
      return false
    });
  });

  ipcMain.handle("update-user-avatar", async (event, filePath) => {
    if (filePath.split(',')[0] === 'data:image/png;base64') {
      let fileData = filePath.split(',')[1]
      let dirPath = getFilePath("/camera")
      filePath = getFilePath("/camera/" + Date.now() + ".jpg")
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath)
      }
      await fs.writeFile(filePath, fileData, {encoding: 'base64'}, function (err) {
        return true
      })
    }
    return await updateAvatar(filePath)
  })

  ipcMain.on("open-confirm-modal", e => {
    const modal = modalWindow(getFilePath("public/html/confirmModal.html"));
    // modal.webContents.openDevTools()
    modal.once("ready-to-show", () => {
      modal.show();
    })

    ipcMain.on("close-modal", e => {
      modal.destroy();
    })
  })

  ipcMain.handle("show-confirm-modal", (e, data) => {
    if(!data.isRemoveFloor) {
      store.set('number-users', data.numberUsers ? 0 : 1)
    }
    store.set('remove-data', data);
    const modal = modalWindow(getFilePath("public/html/confirmRemove.html"));
    modal.once("ready-to-show", () => {
      modal.show();
    })

    ipcMain.on("close-modal", e => {
      modal.destroy();
    })
  })
  //End Modal
}


app.whenReady().then(() => {
  createWindow();
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", async () => {
  // if (process.platform !== "darwin") {
  // }
  await leaveRoom()
  app.quit();
});


// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
const convertObjecttoArry = (data: any) => {
  return Object.keys(data).map((i) => {
    let dataArray = data[i];
    return dataArray
  })
}

let userId: any;
ipcMain.handle("get-user-id", async (event: any, data: any) => {
  return new Promise(function (resolve, reject) {
    userId = store.get("userId");
    return resolve(userId)
  });
});

ipcMain.handle("createUser", async (event, data) => {
  return axiosIns.post("/users", data)
    .then(function (response: any) {
      store.set('userId', response.data.id)
      check = "Done";
      return check
    })
    .catch(function (error: any) {
      check = error.response.data.message;
      return check
    });
});

ipcMain.handle("verifyRegisterCode", async (event: any, data: any) => {
  return axiosIns.post("/users/verifyRegisterCode", data)
    .then(function (response: any) {
      check = "Done";
      return check
    })
    .catch(function (error: any) {
      check = "error";
      return check
    });
});

ipcMain.handle("getFloor", async (event: any, data: any) => {
  let company_id = store.get('company_id');
  store.set('current_floor', data.floor_id)
  if (company_id == "" || company_id == null || company_id == undefined) {
    company_id = data.company_id;
  }
  return axiosIns.get(`/floors/active/${company_id}`)
    .then(function (response: any) {
      let data = {
        floors: convertObjecttoArry(response.data)
      }
      return data;
    })
    .catch(function (error: any) {
      check = "error";
      return check
    });
});

ipcMain.handle("getUsersById", async (event: any, data: any) => {
  return axiosIns.get(`/users/${data}`)
    .then(function (response: any) {
      return response.data.user
    })
    .catch(function (error: any) {
      check = "error";
      return check
    });
});

ipcMain.handle("getFristFloorOfCompany", async (event: any, companyId: any) => {
  return axiosIns.get(`/floors/active/${companyId}`)
    .then(function (response: any) {
      return convertObjecttoArry(response.data.floors)[0].id
    })
    .catch(function (error: any) {
      check = "error";
      return check
    });
});

ipcMain.handle("getRoomsByStatusAndFloorId", async (event: any, data: any) => {
  return axiosIns.get(`/rooms/active/${data}`)
    .then(function (response: any) {
      check = "Done";
      return {
        rooms: convertObjecttoArry(response.data)
      }
    })
    .catch(function (error: any) {
      check = "error";
      return check
    });
});


ipcMain.handle("/room_icons/active", async (event: any, company_id: any) => {
  company_id = store.get('company_id');
  return axiosIns.get(`/room_icons/active/${company_id}`)
    .then(function (response: any) {
      check = "Done";
      let data = {
        room_icons: convertObjecttoArry(response.data)
      }
      return data
    })
    .catch(function (error: any) {
      check = "error";
      return check
    });
});

ipcMain.handle("addFloor", async (event: any, data: any) => {
  let dataNew = {
    company_id: store.get('company_id'),
    name: data.name,
    created_user: store.get('userId')
  }
  return axiosIns.post(`/floors`, dataNew)
    .then(function (response: any) {
      check = "Done";
      socket.emit('create-new-floor', {
        userId: store.get('userId'),
        username: store.get('userName'),
        name: data.name,
        isCreateFloor: true,
        floor_id: response.data.floor_id,
        old_floor_id: store.get('floorId'),
      })
      return response.data
    })
    .catch(function (error: any) {
      check = "error";
      return check
    });
});

ipcMain.handle("/room_icons", async (event: any, data: any) => {
  return axiosIns.post(`/room_icons`, data)
    .then(function (response: any) {
      check = "Done";
      return response.data
    })
    .catch(function (error: any) {
      check = "error";
      return check
    });
});

ipcMain.handle("storeSet", async (event: any, data: any) => {
  return store.set(data)
})

ipcMain.handle("storeGet", async (event: any, data: any) => {
  return store.get(data)
})

ipcMain.handle("storeDelete", async (event: any, key: any) => {
  return store.delete(key)
})

ipcMain.handle("login", async (event: any, data: any) => {
  return new Promise(function (resolve, reject) {
    const signIn = async () => {
      try {
        const user = await firebaseApp.authenticate(data.email, data.password);
        store.set('uid', user.user.uid);
        let companyId = getCompanyId(user.user.uid);
        store.set('token', user._tokenResponse.idToken);
        store.set('refreshToken', user._tokenResponse.refreshToken)
        axiosIns.defaults.headers.common['Authorization'] = 'Bearer ' + user._tokenResponse.idToken;
        return companyId
      }
      catch (err) {
        return "err"
      }
    };
    signIn();
    initApp();
    return resolve(signIn())
  });
});

const getCompanyId = (uid: any) => {
  return axiosIns.get(`/users/getCompanyId/${uid}`)
    .then(function (response: any) {
      store.set('userId', response.data.users[0].id)
      store.set('company_id', response.data.users[0].company_id)
      return response.data.users[0].company_id
    })
    .catch(function (error: any) {
      return error
    });
}

ipcMain.handle("get-users-company", async (event: any, data: any) => {
  let company_id = store.get('company_id');
  return axiosIns.get(`/users/active/${company_id}`)
    .then(function (response: any) {
      check = "Done";
      let data = {
        users_company: convertObjecttoArry(response.data)
      }
      return data
    })
    .catch(function (error: any) {
      check = "error";
      return check
    });
});

ipcMain.handle("/rooms", async (e: any, data: any) => {
  data.floor_id = store.get('floorId');
  data.created_user = store.get('userId')
  return axiosIns.post(`/rooms`, data)
    .then(function (response: any) {
      check = "Done";
      store.set('room_id', response.data.room_id);
      // emit event create new room for other users at the same floor
      socket.emit('create-new-room', {
        floor_id: data.floor_id,
        room_id: response.data.room_id,
        room_name: data.name,
        icon_images: store.get('icon_images') ?? store.get('default_icon_images'),
        isCreateRoom: true,
        room_icon_id: data.room_icon_id ?? store.get('default_icon_id'),
        username: store.get('userName')
      })
      return response.data
    })
    .catch(function (error: any) {
      check = "error";
      return check
    });
})

// Change status mic, speaker
ipcMain.handle("get-status-mic", async (event: any, data: any) => {
  return new Promise(function (resolve, reject) {
    let statusMic = store.get('status_mic');
    return resolve(statusMic)
  });
});

ipcMain.handle("get-status-speaker", async (event: any, data: any) => {
  return new Promise(function (resolve, reject) {
    let statusSpeaker = store.get('status_speaker');
    return resolve(statusSpeaker)
  });
});

ipcMain.handle("change-status-mic", async (event: any, data: any) => {
  let uid = store.get('uid');
  if(store.get("is_join_room")) {
    socket.emit('change-status-mic', {
      userId: store.get('userId'),
      isChangeMic: true, 
      username: store.get('userName'),
    })
  }
  return axiosIns.post(`/users/updateMicStatus/${uid}`)
    .then(function (response: any) {
      store.set('status_mic', response.data.result[0].is_mic);
      return response.data
    })
    .catch(function (error: any) {
      return "error"
    });
});

ipcMain.handle("change-status-speaker", async (event: any, data: any) => {
  let uid = store.get('uid');
  if(store.get("is_join_room")) {
    socket.emit('change-status-speaker', {
      userId: store.get('userId'),
      isChangeSpeaker: true, 
      username: store.get('userName'),
    })
  }
  return axiosIns.post(`/users/updateSpeakerStatus/${uid}`)
    .then(function (response: any) {
      store.set('status_speaker', response.data.result[0].is_speaker)
      return response.data
    })
    .catch(function (error: any) {
      return error
    });
});

ipcMain.handle("channel-Agora", async (event: any, data: any) => {
  let dataChannel = store.get('dataChannel');
  return new Promise(function (resolve, reject) {
    return resolve(dataChannel);
  });
});

ipcMain.handle("change-room", async (event: any, data: any) => {
  if (store.get('old_room') == data.room_id) {
    return "Not_changed";
  } else {
    if (store.get('old_room')) {
      if (store.get('old_room') != data.room_id) {
        data.changeNewRoom = true;
      }
    }
    store.set('old_room', data.room_id)
    data.username = store.get('userName');
    data.userAvatar = store.get('userAvatar')
    data.uid = store.get('uid')
    sound.play(getFilePath('public/static/joinRoom.wav'))
    socket.emit('join-room', data)
    store.set('is_join_room', true)
    let uid = store.get('uid');
    store.set('room_id', data.room_id);
    store.set('status_mic', '0')
    store.set('floorId', data.floor_id);
    let dataNew = {
      uid: uid,
      room_id: data.room_id
    }

    return axiosIns.post(`/room_users/changeRoom`, dataNew)
      .then(function (response: any) {
        store.set('dataChannel', response.data.result);
        return response.data.result
      })
      .catch(function (error: any) {
        return "error"
      });
  }
});

ipcMain.handle("update-room-voices", async (event: any, data: any) => {
  let dataRoomVoice = {
    room_id: store.get('room_id')
  }
  return axiosIns.post(`/room_voices/updateRoomVoice`, dataRoomVoice)
    .then(function (response: any) {
      return response.data
    })
    .catch(function (error: any) {
      return "error"
    });
});

const leaveRoom = () => {
  let data = {
    uid: store.get('uid')
  };
  store.delete('old_room');
  store.delete('is_join_room')
  socket.emit('leave-room', {
    room_id: store.get('room_id'),
    floor_id: store.get('floorId'),
    username: store.get('userName'),
    userId: store.get('userId'),
    leave: true
  });
  store.delete('room_id')
  return axiosIns.post("/room_users/leaveRoom", data).then(() => {
    return true
  }).catch(() => {
    return false
  })
}


const getUserInfo = (id: string) => {
  return axiosIns.get(`users/${id}`).then((res: { data: any; }) => {
    return res.data
  }).catch((error: { data: any; }) => {
    return error.data
  })
}

ipcMain.handle('getCurrentAvatar', async (event: any, data: any) => {
  return axiosIns.get(`users/${store.get('userId') as string}`).then((res: any) => {
    store.set({
      userAvatar: res.data.user.avatar,
      userName: res.data.user.onamae
    })
    return res.data.user.avatar
  }).catch((error: { data: any; }) => {
    return error.data
  })
})

ipcMain.handle('getCurrentName', async (event: any, data: any) => {
  return axiosIns.get(`users/${store.get('userId') as string}`).then((res: any) => {
    store.set({userName: res.data.user.onamae})
    return res.data.user.onamae
  }).catch((error: { data: any; }) => {
    return error.data
  })
})

ipcMain.handle('remove-room', async (event: any, data: any) => {
  const uids = data.uids.replace('[', '').replace(']', '').split(',')
  axiosIns.delete(`rooms/${data.room_id}`)
    .then((res: any) => {
      socket.emit('remove-room', {
        userId: store.get('userId'),
        username: store.get('userName'),
        room_id: data.room_id,
        floor_id: store.get('floorId'),
        uids: data.numberUsers? uids : [],
        isRemoveRoom: true
      })
    })
  if(data.numberUsers > 0) {
    Promise.all(uids.map((uid : any) => axiosIns.post("/room_users/leaveRoom", {uid: uid})))
  }
})

ipcMain.handle('remove-floor', async (event: any, data: any) => {
  console.log(data)
  Promise.all([
    axiosIns.delete(`floors/${data.floor_id}`),
    axiosIns.get(`/room_users/active/floor/${data.floor_id}`)
  ]).then((response: any) => {
      const [isRemoved, result] = response;
      const users = convertObjecttoArry(result.data.room_users);
      const uids = users.map((user: any) => user.uid)
      socket.emit('remove-floor', {
        floor_id: data.floor_id,
        uids: uids,
        isRemoveFloor: true
      })
      Promise.all(uids.map((uid : any) => axiosIns.post("/room_users/leaveRoom", {uid: uid})))
   })
})


const setCurrentUserInfo = () => {
  getUserInfo(store.get('userId') as string)
    .then((res: { user: { avatar: any; onamae: any; }; }) => {
      store.set({
        userAvatar: res.user.avatar,
        userName: res.user.onamae
      })
    })
    .catch((error: any) => {
    })
}

async function initApp() {
  await getCompanyId(store.get('uid'));
  await setCurrentUserInfo()
}

const updateAvatar = (filePaths: string, is_base64?: boolean) => {
  let img = fs.createReadStream(filePaths)
  let data = new FormData()
  data.append("photos", img)
  data.append("uid", store.get('uid'))

  return axiosIns.post(`/users/changeAvatar/${store.get('uid')}`, data)
    .then(function (response: any) {
      if (store.get('is_join_room')) {
        socket.emit('change-avatar', {
          userId: store.get('userId'),
          username: store.get('userName'),
          changeAvatar: true,
          userAvatar: response.data.avatar
        })
      }
      return [response.status.toString(), response.data.avatar]
    })
    .catch(function (error: any) {
      return [error.response.status, error.response.data.message]
    });
}

ipcMain.handle("change-login-status", async (event, data) => {
  socket.emit('change-login-status', {
    userId: store.get('userId'),
    username: store.get('userName'),
    floor_id: store.get('floorId'),
    isChangeStatusLogin: true,
    status: data.login_status,
    isPhoneStatus: data.login_status == 1 ? true : false
  })
  return axiosIns.post(`/users/changeLoginStatus/${store.get('uid')}`, data)
    .then(function (response: any) {
      check = "Done";
      return check
    })
    .catch(function (error: any) {
      check = error.response.data.message;
      return check
    });
});