var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var userAvatar = document.getElementById('currentAvatar');
const statusUser = ["オフライン", "オンライン中", "多忙中", "離席中", "電話中", "休憩中"];
const colorStatus = ["gray", "green", "#5d0b0b", "#b5c014", "#911258", "orange"];
const micOn = document.querySelector(`.mic #mic-on`);
const micOff = document.querySelector(`.mic #mic-off`);
const speakerOn = document.querySelector(`.headphone #speaker-on`);
const speakerOff = document.querySelector(`.headphone #speaker-off`);
const listStatusUserIcon = ['../static/offline.png', '../static/online.png', '../static/busy.png', '../static/leaving.png', '../static/calling.png', '../static/sleeping.png'];
function openRoomCreate() {
    window.api.send("open-room-create");
}
function exitRoom() {
    return __awaiter(this, void 0, void 0, function* () {
        if (window.api.store('Get', 'is_join_room')) {
            yield window.api.invoke('leaveRoom');
            joinChannel('off-speaker');
        }
        if (localStorage.getItem("is_setting_page")) {
            localStorage.removeItem("is_setting_page");
            showFloor(localStorage.getItem("floorId"));
        }
    });
}
window.api
    .store("Get", "floorId")
    .then(function (floor_id) {
    showPageFloor(floor_id);
    window.api.store('Get', 'userName')
        .then((userName) => {
        document.getElementById("username").innerHTML = userName;
    });
});
function showFloor(id) {
    const oldFloorId = localStorage.getItem("floorId");
    window.api.store('Set', { floorId: id });
    localStorage.setItem("floorId", id);
    getPageFloor(oldFloorId, id);
}
const goBackToFLoor = () => {
    localStorage.removeItem("is_setting_page");
    getPageFloor(null, localStorage.getItem('floorId'));
};
function getPageFloor(oldFloorId, floor_id) {
    Promise.all([
        window.api.invoke("getRoomsByStatusAndFloorId", floor_id),
        window.api.invoke("getActiveRoomUsersByFloorId", floor_id)
    ])
        .then((data) => {
        const [rooms, users] = data;
        renderHTMLInFloor(floor_id, rooms, users, oldFloorId);
    });
}
const renderHTMLInFloor = (floor_id, rooms, users, oldFloorId) => {
    const result = [];
    console.log(users);
    for (let i = 0; i < rooms.rooms[0].length; i++) {
        result.push({
            room_id: rooms.rooms[0][i].room_id,
            room: {
                room_id: rooms.rooms[0][i].room_id,
                room_name: rooms.rooms[0][i].room_name,
                icon_images: rooms.rooms[0][i].icon_images
            }
        });
    }
    for (let i = 0; i < users.length; i++) {
        const index = result.findIndex((item) => item.room_id == users[i].room_id);
        if (index != -1) {
            const user = {
                user_id: users[i].user_id,
                user_name: users[i].user_name,
                user_avatar: users[i].user_avatar,
                user_is_mic: users[i].user_is_mic,
                user_is_speaker: users[i].user_is_speaker,
                uid: users[i].uid,
                user_login_status: users[i].user_login_status
            };
            if (result[index].users) {
                result[index].users.push(user);
            }
            else {
                result[index].users = [user];
            }
        }
    }
    let floorHTML = '';
    for (let i = 0; i < result.length; i++) {
        floorHTML += createRoomElement(result[i].room, result[i].users);
    }
    if (oldFloorId != null) {
        changeBackgroundColorForElement(`${oldFloorId}`, 'rgb(252,76,86)');
    }
    changeBackgroundColorForElement(`${floor_id}`, 'rgb(238,238,238)');
    document.getElementById("room-list").innerHTML = floorHTML;
};
function changeBackgroundColorForElement(elementId, color) {
    const element = document.getElementById(elementId);
    if (element != null) {
        element.style.backgroundColor = color;
    }
}
function createUsersHTMLInRoom(user) {
    var _a, _b;
    let displayMicOn = "none";
    let displayMicOff = "inline";
    let dispayStatus = '';
    const colorBackroundStatus = (_a = colorStatus[user.user_login_status]) !== null && _a !== void 0 ? _a : '';
    if (user.user_is_mic == '1') {
        displayMicOn = "inline";
        displayMicOff = "none";
    }
    let displaySpeakerOn = "none";
    let displaySpeakerOff = "inline";
    if (user.user_is_speaker == '1') {
        displaySpeakerOn = "inline";
        displaySpeakerOff = "none";
    }
    let user_login_status = (_b = statusUser[user.user_login_status]) !== null && _b !== void 0 ? _b : '';
    if (!user_login_status) {
        dispayStatus = '-none';
        user_login_status = '';
    }
    return `
                          <li class="object">
                            <div class="user" id="user-${user.user_id}">
                              <div class="logo-userbutton"><img src=${user.user_avatar}></div>
                              <div class="status-users" style="background-color: ${colorBackroundStatus}">
                                <img src="${listStatusUserIcon}">
                              </div>
                              <h4 class="username">${user.user_name}</h4>
                            </div>
                            <div class="flex-container">
                              <div class="mic button" onclick="changeStatusMic(${user.user_id})">
                                <span class="material-icons" id="mic-on-${user.user_id}" style="display: ${displayMicOn};">
                                    mic
                                </span>
                                <span class="material-icons" id="mic-off-${user.user_id}" style="display: ${displayMicOff};">
                                    mic_off
                                </span>
                              </div>
                              <div class="headphone button" onclick="changeStatusSpeaker(${user.user_id});">
                                <span class="material-icons" id="speaker-on-${user.user_id}" style="display: ${displaySpeakerOn};">
                                    headset
                                </span>
                                <span class="material-icons" id="speaker-off-${user.user_id}" style="display: ${displaySpeakerOff};>
                                    headset_off
                                </span>
                              </div>
                            </div>
                          </li>
                          `;
}
function createRoomHTML(room) {
    return `
            <div class="relative" id="room-${room.room_id}">
              <button onclick ="showConfirmModel(${room.room_id}, '[]' , 0)" class="remove-room"> x </button>
              <div class="header-room button"  onclick="joinRoom(${room.room_id})">
                <div class="circle">
                <svg class="svg-circle">
                    <circle cx="50" cy="40" r="30"></circle>
                  </svg>
                </div>
                <h4 class="button">${room.room_name}</h4>
              </div>
              <div id="info-user-room-${room.room_id}">
                <div id="your-proflie-${room.room_id}"></div>
              </div>
            </div>
          `;
}
function createRoomElement(room, users) {
    let usersHTML = '';
    if (users) {
        for (let i = 0; i < users.length; i++) {
            usersHTML += createUsersHTMLInRoom(users[i]);
        }
    }
    const uids = users === null || users === void 0 ? void 0 : users.map((user) => user.uid);
    return `
  <div class="relative" id="room-${room.room_id}">
  <button onclick ="showConfirmModel(${room.room_id}, '[${uids}]' , ${users === null || users === void 0 ? void 0 : users.length})" class="remove-room"> x </button>
    <div class="header-room button"  onclick="joinRoom(${room.room_id})">
    <div class="circle">
                  <svg class="svg-circle">
                    <circle cx="50" cy="40" r="30"></circle>
                  </svg>
                </div>
      <h4 class="button">${room.room_name} </h4>
    </div>
    <div id="info-user-room-${room.room_id}">
      <div id="your-proflie-${room.room_id}"></div>
    </div>
    ${usersHTML}
  </div>
`;
}
const showConfirmModelFloor = (floor_id) => {
    window.api.invoke("show-confirm-modal", {
        floor_id: floor_id,
        isRemoveFloor: true,
        type: 'floor'
    });
};
const showConfirmModel = (room_id, uids, length) => {
    const data = {
        room_id: room_id,
        uids: uids,
        numberUsers: length,
        type: 'room'
    };
    window.api.invoke("show-confirm-modal", data);
};
const showPageFloor = (floor_id) => {
    localStorage.setItem('floorId', floor_id);
    Promise.all([window.api.invoke("getFloor", {
            company_id: localStorage.getItem("companyId"),
            floor_id: floor_id
        }),
        window.api.invoke("getRoomsByStatusAndFloorId", floor_id),
        window.api.invoke("getActiveRoomUsersByFloorId", floor_id),
        window.api.invoke("getUsersById", localStorage.getItem('userId'))])
        .then((data) => {
        const [floors, rooms, users, user] = data;
        if (floors.floors[0] == "") {
            let elButtonAdd = `<div class="floor add-new" style="top: 10px; background-color: black; z-index: -1;" onclick="addFloor()"><p>+</p></div>`;
            addElement(elButtonAdd, "floors");
        }
        else {
            const floorsHTML = createFLoorsHTML(floors.floors[0], floor_id);
            renderHTMLInFloor(floor_id, rooms, users, null);
            document.getElementById('floors').innerHTML = floorsHTML;
            loadStatusUser(user);
        }
    });
};
const loadStatusUser = (user) => {
    if (user.is_mic == 1) {
        micOn.style.display = "inline";
        micOff.style.display = "none";
    }
    else {
        micOff.style.display = "inline";
        micOn.style.display = "none";
    }
    if (user.is_speaker == 1) {
        speakerOn.style.display = "inline";
        speakerOff.style.display = "none";
    }
    else {
        speakerOff.style.display = "inline";
        speakerOn.style.display = "none";
    }
};
function createFLoorsHTML(floors, floor_id) {
    localStorage.setItem('first_floor', floors[0].id);
    let floorsHTML = ``;
    for (let i = 0; i < floors.length; i++) {
        floorsHTML += createFLoorElement(floors[i], i * 60, floors[i].id == floor_id ?
            '#7f7f7f' :
            '#dbdbdb');
    }
    floorsHTML += `<div class="floor add-new" style=" background-color: black; z-index: -1;" onclick="addFloor()"><p>+</p></div>`;
    return floorsHTML;
}
function createFLoorElement(floor, position, backgroundColor) {
    return `
  <div class="floor" style="top: ${position}px; background-color: ${backgroundColor}; z-index: 1000;" id=${floor.id} onclick="showFloor(${floor.id})" >
    <button onclick ="showConfirmModelFloor(${floor.id})" class="remove-floor" > x </button>
    <p>${floor.name}</p>
  </div>`;
}
function appendUser(user) {
    var _a, _b, _c;
    console.log(user);
    if (user.changeNewRoom) {
        removeUser(user);
    }
    const listStatusUser = ["オフライン", "オンライン中", "多忙中", "離席中", "電話中", "休憩中"];
    const loginStatus = (_a = listStatusUser[user.login_status]) !== null && _a !== void 0 ? _a : '';
    const colorBackroundStatus = (_b = colorStatus[user.login_status]) !== null && _b !== void 0 ? _b : '';
    let dispayStatus = '';
    let displayMicOn = "none";
    let displayMicOff = "inline";
    if (user.user_is_mic == '1') {
        displayMicOn = "inline";
        displayMicOff = "none";
    }
    let displaySpeakerOn = "none";
    let displaySpeakerOff = "inline";
    if (user.user_is_speaker == '1') {
        displaySpeakerOn = "inline";
        displaySpeakerOff = "none";
    }
    if (!user.login_status) {
        dispayStatus = '-none';
    }
    let text = `
  <li class="object" style="display: flex">
  <div class="user" id="user-${user.user_id}">
    <div class="logo-userbutton"><img src=${user.user_avatar}></div>
    <div class="status-users" style="background-color: ${colorBackroundStatus}">
    <img src="${listStatusUserIcon[user.user_avatar]}">
    </div>
    <h4 class="username">${user.user_name}</h4>
  </div>
  <div class="flex-container" >
    <div class="mic button" onclick="changeStatusMic(${user.user_id})">
      <span class="material-icons" id="mic-on-${user.user_id}" style="display: ${displayMicOn};">
          mic
      </span>
      <span class="material-icons" id="mic-off-${user.user_id}" style="display: ${displayMicOff};">
          mic_off
      </span>
    </div>
    <div class="headphone button" onclick="changeStatusSpeaker(${user.user_id});">
      <span class="material-icons" id="speaker-on-${user.user_id}" style="display: ${displaySpeakerOn};">
          headset
      </span>
      <span class="material-icons" id="speaker-off-${user.user_id}" style="display: ${displaySpeakerOff};>
          headset_off
      </span>
    </div>
  </div>
</li>
              `;
    const userElement = document.createElement('div');
    userElement.innerHTML = text;
    (_c = document.getElementById(`room-${user.room_id}`)) === null || _c === void 0 ? void 0 : _c.appendChild(userElement);
}
function removeUser(user) {
    if (!user.isChangeRoom && user.leave) {
        if (user.userId == localStorage.getItem('userId')) {
            changeStatus("speaker-on", "speaker-off");
            changeStatus("mic-on", "mic-off");
        }
    }
    const userElement = document.getElementById(`user-${user.userId}`);
    if (userElement != null) {
        userElement.parentNode.removeChild(userElement);
    }
}
function changeAvatar(user) {
    const avatarElement = document.querySelector(`#user-${user.userId} .logo-user img`);
    if (avatarElement != null) {
        avatarElement.setAttribute('src', user.userAvatar);
    }
}
function changeUserEvent(user) {
    if (user.isChangeName) {
        const userElement = document.querySelector(`user-${user.userId} h4`);
        if (userElement) {
            userElement.innerHTML = user.username;
        }
    }
    else if (user.isChangeMic) {
        const micOn = document.querySelector(`#mic-on-${user.userId}`);
        const micOff = document.querySelector(`#mic-off-${user.userId}`);
        if (micOn != null && micOff != null) {
            if (user.isChangeMic) {
                if (micOn.style.display === 'none') {
                    micOff.style.display = 'none';
                    micOn.style.display = 'inline';
                }
                else {
                    micOff.style.display = 'inline';
                    micOn.style.display = 'none';
                }
            }
        }
    }
}
function changeLoginStatus(user) {
    const loginStatus = document.querySelector(`#login-status-${user.userId}`);
    if (loginStatus != null) {
        loginStatus.style.backgroundColor = colorStatus[user.status];
        loginStatus.innerText = statusUser[user.status];
    }
    if (user.userId == localStorage.getItem('userId')) {
        document.getElementById('status').innerHTML = statusUser[user.status];
    }
}
const removeRoom = (room) => __awaiter(this, void 0, void 0, function* () {
    const roomRemovedElement = document.getElementById(`room-${room.room_id}`);
    document.getElementById('room-list').removeChild(roomRemovedElement);
    window.api.store('Get', 'uid')
        .then((uid) => {
        var _a;
        if ((_a = room.uids) === null || _a === void 0 ? void 0 : _a.includes(uid)) {
            window.api.store('Delete', 'is_join_room');
        }
    });
});
const removeFloor = (data) => __awaiter(this, void 0, void 0, function* () {
    console.log(data);
    window.api.store('Get', 'uid')
        .then((uid) => {
        var _a;
        if ((_a = data.uids) === null || _a === void 0 ? void 0 : _a.includes(uid)) {
            window.api.store('Delete', 'is_join_room');
        }
    });
    if (localStorage.getItem('floorId') == data.floor_id) {
        showPageFloor(localStorage.getItem('first_floor'));
    }
    else {
        showPageFloor(localStorage.getItem('floorId'));
    }
});
function appendNewRoom(user) {
    var _a;
    let oldRoom = document.getElementById(`room-${user.room_id}`);
    if (oldRoom == null) {
        const newRoomElement = document.createElement('div');
        newRoomElement.setAttribute('id', `room-${user.room_id}`);
        newRoomElement.setAttribute('class', 'room');
        newRoomElement.innerHTML = createRoomHTML(user);
        (_a = document.getElementById('room-list')) === null || _a === void 0 ? void 0 : _a.appendChild(newRoomElement);
    }
}
function appendNewFloor(user) {
    var _a, _b;
    const newFloorElement = document.createElement('div');
    newFloorElement.setAttribute('id', `${user.floor_id}`);
    newFloorElement.setAttribute('class', 'floor');
    newFloorElement.setAttribute('onclick', `showFloor(${user.floor_id})`);
    if (user.user_id == localStorage.getItem('userId')) {
        newFloorElement.style.backgroundColor = '#7f7f7f';
    }
    else {
        newFloorElement.style.backgroundColor = '#dbdbdb';
    }
    newFloorElement.style.zIndex = '1000';
    newFloorElement.innerHTML = `
                <button onclick ="showConfirmModelFloor(${user.floor_id})" class="remove-floor" > x </button>
                <p>${user.name}</p>
                `;
    const numberChilds = (_a = document.getElementById('floors')) === null || _a === void 0 ? void 0 : _a.children.length;
    const addFloor = document.querySelector('.floor.add-new');
    if (numberChilds != null && addFloor != null) {
        const position = ((numberChilds == 1 ? 0 : numberChilds - 1) * 60);
        newFloorElement.style.right = `${position}px`;
        addFloor.style.right = `${position + 60}px`;
    }
    if (localStorage.getItem('userId') == user.userId && numberChilds > 2) {
        document.getElementById(`${user.old_floor_id}`).style.backgroundColor = '#dbdbdb';
        localStorage.setItem("floorId", user.floor_id);
        window.api.store('Set', { floorId: user.floor_id });
    }
    (_b = document.getElementById('floors')) === null || _b === void 0 ? void 0 : _b.appendChild(newFloorElement);
}
function addFloor() {
    let floor = document.getElementsByClassName("floor");
    if (floor.length > 10) {
        console.log("Fails");
    }
    else {
        let text = `
            <div class="add" id="add">
            <p>フロア名</p>
            <div class="input" > <input type="text" id="input"> </div>
            <div class="btn">
                <button class="cancel" onclick="cancelCreate()">キャンセル</button>
                <button class="confirm" onclick="confirmCreate()">追加</button>
            </div>
            </div>
        `;
        addElement(text, "add-floor");
    }
}
function addWarring(text) {
    let boxWarring = document.getElementById("warring");
    if (boxWarring != null || boxWarring != undefined) {
        boxWarring.parentNode.removeChild(boxWarring);
        let elWarring = `
                <p class="warring" id="warring" style= "margin-top: -20px;"> ${text} <p>
            `;
        addElement(elWarring, "add");
    }
    else {
        let elWarring = `
            <p class="warring" id="warring"> ${text} <p>
        `;
        addElement(elWarring, "add");
    }
}
function cancelCreate() {
    deleteElement("add");
}
function confirmCreate() {
    let nameFloor = document.getElementById("input");
    let data = {
        name: nameFloor.value,
    };
    if (nameFloor.value.length == 0) {
        addWarring("* フロアー名を入力して下さい");
    }
    else if (nameFloor.value.length > 10) {
        addWarring("* 文字数は全角10文字以内で入力して下さい");
    }
    else {
        window.api
            .invoke("addFloor", data)
            .then(function (res) {
            if (res != "Fails") {
                deleteElement("add");
                showFloor(res.floor_id);
            }
            else {
                let text = `
                        <div class="add" id="add">
                        <p>作成に失敗しました</p>
                        </div>
                    `;
                addElement(text, "add-floor");
            }
        })
            .catch(function (err) {
            console.error(err);
        });
    }
}
function addElement(text, elId) {
    let elAdd = document.createElement("div");
    elAdd.innerHTML = text;
    let boxEl = document.getElementById(elId);
    boxEl === null || boxEl === void 0 ? void 0 : boxEl.appendChild(elAdd);
}
function deleteElement(elId) {
    let el = document.getElementById(elId);
    if (el) {
        el.remove();
    }
}
function closeWindown() {
    window.api.send("open-confirm-modal");
}
function minimizeWindown() {
    window.api
        .invoke("minimize-window", "")
        .then(function (res) {
        if (res == "Done") {
            console.log("Done");
        }
    })
        .catch(function (err) {
        console.error(err);
    });
}
let coutClick = 0;
function pinWindown() {
    coutClick++;
    if (coutClick % 2 == 0) {
        window.api
            .invoke("set-window-off-top", "")
            .then(function (res) {
            if (res == "Done") {
                console.log("Done");
            }
        })
            .catch(function (err) {
            console.error(err);
        });
    }
    else {
        window.api
            .invoke("set-window-on-top", "")
            .then(function (res) {
            if (res == "Done") {
                console.log("Done");
            }
        })
            .catch(function (err) {
            console.error(err);
        });
    }
}
function getMemberList() {
    document.getElementById('room-list').innerHTML = '';
    window.api
        .invoke("get-users-company", "")
        .then(function (res) {
        localStorage.setItem("is_setting_page", "true");
        if (res == "error") {
            console.log("error");
        }
        else {
            deleteElement("room");
            let text = `
        <div class="room" id="room">
        </div>
      `;
            addElement(text, "room-list");
            for (let i = 0; i < res.users_company[0].length; i++) {
                let check;
                if (res.users_company[0][i].role == "admin") {
                    check = "block";
                }
                else {
                    check = "none";
                }
                let displayMicOn = "none";
                let displayMicOff = "inline";
                if (res.users_company[0][i].is_mic == '1') {
                    displayMicOn = "inline";
                    displayMicOff = "none";
                }
                let displaySpeakerOn = "none";
                let displaySpeakerOff = "inline";
                if (res.users_company[0][i].is_speaker == '1') {
                    displaySpeakerOn = "inline";
                    displaySpeakerOff = "none";
                }
                let text = `
          <div class="user" style="width: 280px;">
          <div class="logo"><img src="${res.users_company[0][i].avatar}"></div>
          <div ><img src="../static/crown.png" style="margin-left: -9px; display: ${check}"  width="10px" height="10px"></div>
          <h4>${res.users_company[0][i].onamae}</h4>
          <div class="mic button" onclick="changeStatusMic(${res.users_company[0][i].user_id})">
            <i class="fa-solid fa-microphone" style="display: ${displayMicOn};" id="mic-on-${res.users_company[0][i].user_id}"></i>
            <i class="fa-solid fa-microphone-slash" id="mic-off-${res.users_company[0][i].user_id}" style="display: ${displayMicOff};"></i>
          </div>
          <div class="headphone button" onclick="changeStatusSpeaker(${res.users_company[0][i].user_id})">
            <i class="fa-solid fa-headphones" id="speaker-on-${res.users_company[0][i].user_id}" style="display: ${displaySpeakerOn};"></i>
            <img src="../static/earphone.png"  class="fa-solid fa-earphones" id="speaker-off-${res.users_company[0][i].user_id}" style="display: ${displaySpeakerOff}; width: 20px; height: 20px;" >
          </div>
        </div>
      `;
                addElement(text, "room");
            }
        }
    })
        .catch(function (err) {
        console.error(err);
    });
}
// Change Status Mic, Speaker
function changeStatus(idElementOn, idElementOff) {
    let elementOn = document.getElementById(idElementOn);
    if (elementOn != null) {
        elementOn.style.display = "none";
    }
    let elementOff = document.getElementById(idElementOff);
    if (elementOff != null) {
        elementOff.style.display = "inline";
    }
}
function changeStatusMic(id) {
    var _a;
    let userId = localStorage.getItem("userId");
    if (id == "0") {
        id = userId;
    }
    if (userId == id) {
        if (micOn.style.display == "none") {
            if (((_a = document.getElementById(`speaker-on-${userId}`)) === null || _a === void 0 ? void 0 : _a.style.display) === 'none' || (speakerOn === null || speakerOn === void 0 ? void 0 : speakerOn.style.display) === 'none') {
                changeStatusSpeaker(id);
            }
        }
        window.api
            .invoke("change-status-mic", "")
            .then(function (res) {
            if (res.result[0].is_mic == 0) {
                changeStatus("mic-on", "mic-off");
                changeStatus(`mic-on-${userId}`, `mic-off-${userId}`);
                leaveChannel();
            }
            else {
                changeStatus("mic-off", "mic-on");
                changeStatus(`mic-off-${userId}`, `mic-on-${userId}`);
                joinChannel("mic-on");
            }
        })
            .catch(function (err) {
            console.error(err);
        });
    }
}
function getUser() {
    window.api.invoke("getUsersById", localStorage.getItem("userId"))
        .then(function (resUser) {
        if (resUser == "error") {
            console.log("error");
        }
        else {
            let micOn = document.getElementById("mic-on");
            let micOff = document.getElementById("mic-off");
            micOn.style.display = "none";
            micOff.style.display = "none";
            let speakerOn = document.getElementById("speaker-on");
            let speakerOff = document.getElementById("speaker-off");
            speakerOn.style.display = "none";
            speakerOff.style.display = "none";
            if (resUser.is_mic == '1') {
                micOn.style.display = "inline";
            }
            else {
                micOff.style.display = "inline";
            }
            if (resUser.is_speaker == '1') {
                speakerOn.style.display = "inline";
            }
            else {
                speakerOff.style.display = "inline";
            }
        }
    })
        .catch(function (err) {
        console.error(err);
    });
}
window.api
    .invoke("get-user-id", "")
    .then(function (res) {
    localStorage.setItem("userId", res);
})
    .catch(function (err) {
    console.error(err);
});
function changeStatusSpeaker(id) {
    let userId = localStorage.getItem("userId");
    if (id == "0") {
        id = userId;
    }
    if (userId == id) {
        if (speakerOn.style.display == 'inline') {
            if (document.getElementById(`mic-off-${userId}`).style.display === 'none') {
                changeStatusMic(id);
            }
        }
        window.api
            .invoke("change-status-speaker", "")
            .then(function (res) {
            if (res.result[0].is_speaker == 0) {
                changeStatus("speaker-on", "speaker-off");
                changeStatus(`speaker-on-${userId}`, `speaker-off-${userId}`);
                joinChannel('off-speaker');
                // window.api.agoraVoice('muteAudio', muteAudio(true))
            }
            else {
                changeStatus("speaker-off", "speaker-on");
                changeStatus(`speaker-off-${userId}`, `speaker-on-${userId}`);
                // window.api.agoraVoice('muteAudio', muteAudio(false))
                joinChannel('mic-on');
            }
        })
            .catch(function (err) {
            console.error(err);
        });
    }
}
function joinRoom(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = {
            room_id: id,
            floor_id: localStorage.getItem('floorId'),
            userId: localStorage.getItem('userId'),
            user_is_mic: micOn.style.display == 'inline' ? 1 : 0,
            user_is_speaker: speakerOn.style.display == 'inline' ? 1 : 0,
            login_status: localStorage.getItem('status_login')
        };
        window.api.invoke("change-room", data)
            .then(function (res) {
            if (res != "Not_changed") {
                if (speakerOn.style.display == 'inline') {
                    if (micOn.style.display == 'inline') {
                        joinChannel('join-room-mic-speaker-on');
                    }
                    else {
                        joinChannel('join-room-speaker-on');
                    }
                }
                else {
                    joinChannel('join-room');
                }
            }
        })
            .catch(function (err) {
            console.error(err);
        });
    });
}
function joinChannel(statusMic) {
    window.api
        .invoke("channel-Agora", "")
        .then(function (data) {
        data.statusMic = statusMic;
        window.api
            .agoraVoice(data)
            .then(function (res) {
        })
            .catch(function (err) {
            console.error(err);
        });
    })
        .catch(function (err) {
        console.error(err);
    });
}
function leaveChannel() {
    window.api
        .invoke("channel-Agora", "")
        .then(function (data) {
        data.statusMic = "mic-off";
        window.api
            .agoraVoice(data)
            .then(function (res) {
        })
            .catch(function (err) {
            console.error(err);
        });
    })
        .catch(function (err) {
        console.error(err);
    });
}
function showSelectStatus() {
    let showStatus = document.getElementById("show-status");
    showStatus.style.display = "block";
}
window.onload = function () {
    let showStatus = document.getElementById("show-status");
    document.onclick = function (element) {
        if (element.target.id != "status" && showStatus != null) {
            if (element.target.id === "custom-status") {
                // TODO: need add new columns to show status
            }
            else {
                showStatus.style.display = "none";
            }
        }
    };
};
function changeStatusUser(idStatus) {
    localStorage.setItem('status_login', idStatus);
    let data = {
        login_status: idStatus
    };
    if (speakerOn.style.display === 'inline') {
        changeStatusSpeaker(localStorage.getItem('userId'));
    }
    else if (micOn.style.display === 'inline') {
        changeStatusMic(localStorage.getItem('userId'));
    }
    window.api
        .invoke("change-login-status", data)
        .then(function (res) {
    })
        .catch(function (err) {
    });
}
function Init() {
    return __awaiter(this, void 0, void 0, function* () {
        let avatar = yield window.api.invoke('getCurrentAvatar');
        userAvatar.setAttribute('src', avatar);
        userAvatar.style.display = "inline";
    });
}
Init();
setInterval(() => {
    window.api
        .store("Get", "on_event")
        .then(function (user) {
        if (user) {
            if (user.leave) {
                removeUser(user);
            }
            else if (user.changeAvatar) {
                changeAvatar(user);
            }
            else if (user.isChangeMic || user.isChangeName) {
                changeUserEvent(user);
            }
            else if (user.isChangeStatusLogin) {
                changeLoginStatus(user);
            }
            else if (user.isCreateRoom) {
                appendNewRoom(user);
            }
            else if (user.isCreateFloor) {
                appendNewFloor(user);
            }
            else {
                appendUser(user);
            }
            window.api.store("Delete", "on_event");
        }
    });
    window.api
        .store("Get", "on_change_speaker")
        .then(function (user) {
        if (user) {
            changeUserEvent(user);
            window.api.store("Delete", "on_change_speaker");
        }
    });
    window.api
        .store("Get", "change-room")
        .then(function (user) {
        if (user) {
            removeUser(user);
            window.api.store("Delete", "change-room");
        }
    });
    window.api
        .store("Get", "on-remove-event")
        .then(function (data) {
        if (data) {
            if (data.isRemoveRoom) {
                removeRoom(data);
            }
            else if (data.isRemoveFloor) {
                removeFloor(data);
            }
            window.api.store("Delete", "on-remove-event");
        }
    });
}, 100);
var userAvatarElement;
var userNameElement;
var errorElementText;
var camera;
var cameraButton;
var cameraCapture;
var localstream;
function capture() {
    let video = document.querySelector("video");
    let image = document.getElementById("userAvatar");
    let canvas = document.createElement("canvas");
    // scale the canvas accordingly
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // draw the video at that frame
    canvas.getContext('2d')
        .drawImage(video, 0, 0, canvas.width, canvas.height);
    // convert it to a usable data URL
    let dataURL = canvas.toDataURL();
    image.src = dataURL;
    window.api.store('Set', {
        'is_new_avata': true,
        'new_avatar_path': dataURL
    });
}
function videoStart() {
    return __awaiter(this, void 0, void 0, function* () {
        yield navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
            return __awaiter(this, void 0, void 0, function* () {
                camera.srcObject = stream;
                cameraButton.setAttribute('onclick', 'videoOff()');
                cameraCapture.hidden = false;
            });
        }).catch(function () {
            alert('could not connect stream');
        });
    });
}
function videoOff() {
    camera.srcObject.getTracks().forEach((track) => track.stop());
    cameraCapture.hidden = true;
    cameraButton.setAttribute('onclick', 'videoStart()');
}
function closeCamera() {
    var _a;
    (_a = camera.srcObject) === null || _a === void 0 ? void 0 : _a.getTracks().map(function (track) {
        track.stop();
    });
}
const logoutRequest = () => {
    window.api.invoke('log-out', "");
};
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        userAvatarElement = document.getElementById('userAvatar');
        userNameElement = document.getElementById('userName');
        errorElementText = document.getElementById('error-message');
        camera = document.getElementById('camera');
        cameraButton = document.getElementById('cameraStart');
        cameraCapture = document.getElementById('cameraCapture');
    });
}
function openNewAvatar() {
    window.api.invoke('open-upload-avatar').then((res) => {
        if (res) {
            userAvatarElement.src = res;
            window.api.store('Set', {
                'is_new_avata': true,
                'new_avatar_path': res
            });
        }
    });
}
function uploadAvatar() {
    return __awaiter(this, void 0, void 0, function* () {
        let new_avatar_path = yield window.api.store('Get', 'new_avatar_path');
        let result = yield window.api.invoke('update-user-avatar', new_avatar_path);
        return result;
    });
}
function saveUserProfile() {
    return __awaiter(this, void 0, void 0, function* () {
        closeCamera();
        let loadingUpData = document.getElementById("loading-up-data");
        loadingUpData.style.display = 'block';
        let avatarElement = document.getElementById('userAvatar');
        let userNameElement = document.getElementById('userName');
        let is_new_avata = yield window.api.store('Get', 'is_new_avata');
        let userName = yield window.api.store('Get', 'userName');
        errorElementText.innerText = "";
        if (is_new_avata) {
            let result = yield uploadAvatar();
            if (result[0] !== "200") {
                let errorMessage = "ファイルサイズは1MB以下です。";
                settingForm(errorMessage);
                return false;
            }
            avatarElement.src = result[1];
            yield window.api.store('Set', { userAvatar: result[1] });
        }
        if (userNameElement.value !== userName) {
            let result = yield uploadName();
            if (result) {
                userNameElement.value = result;
                yield window.api.store('Set', { userName: result });
            }
        }
        loadingUpData.style.display = 'none';
        showFloor(localStorage.getItem("floorId"));
        window.api.store('Delete', 'is_new_avata');
    });
}
function uploadName() {
    let name = document.getElementById("userName").value;
    return window.api.invoke('changeName', name).then((res) => {
        if (res) {
            return name;
        }
        window.api.send('close-modal');
    });
}
function settingForm(errorMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        deleteElement("room");
        window.api.store('Delete', 'is_new_avata');
        window.api.store('Delete', 'new_avatar_path');
        localStorage.setItem("is_setting_page", "true");
        let roomForm = document.getElementById('room-list');
        roomForm.innerHTML = yield settingHTML();
        init();
        errorElementText.innerText = errorMessage;
    });
}
function leaveSettingForm() {
    closeCamera();
    showFloor(localStorage.getItem("floorId"));
}
function settingHTML() {
    return __awaiter(this, void 0, void 0, function* () {
        let userName = yield window.api.store('Get', 'userName');
        let userAvatar = yield window.api.store('Get', 'userAvatar');
        return "<div class=\"userProfile\" id=\"userProfile\" >\n"
            + "            <div class=\"draggable headerProfile\"> ユーザープロフィール</div>\n"
            + "            <div class=\"userName\">\n"
            + "                <div>\n"
            + "                    <label>\n"
            + "                        名前:\n"
            + "                    </label>\n"
            + `                    <input id=\"userName\" value=${userName}>\n`
            + "                </div>\n"
            + "            </div>\n"
            + "            <div class=\"userAvatar\">\n"
            + "                <label>\n"
            + "                    アバター:\n"
            + "                </label>\n"
            + `                <img class=\"imgUserAvatar\" id=\"userAvatar\" src=${userAvatar}>\n`
            + "                <button class=\"uploadImage\" onclick=\"openNewAvatar()\">\n"
            + "                    写真アップロード\n"
            + "                </button>\n"
            + "                <button class=\"camera\" id=\"cameraStart\" onclick=\"videoStart()\">\n"
            + "                    カメラ\n"
            + "                </button>\n"
            + "                <p class=\"error-message\" id=\"error-message\"></p>\n"
            + "                <img src=\"../static/take_picture.png\" class=\"imgCapturePicture\" id=\"cameraCapture\" onclick=\"capture()\" hidden>"
            + "                <img src=\"../static/loading-gif.gif\" class=\"imgCapturePicture\" id=\"loading-up-data\" style=\"display: none\">"
            + "                <video class=\"cameraVideo\" id=\"camera\" autoplay></video>\n"
            + "            </div>\n"
            + "    <div class=\"groupButton\">\n"
            + "        <button class=\"buttonLeft\" onclick=\"saveUserProfile()\">\n"
            + "            保存\n"
            + "        </button>\n"
            + "\n"
            + "        <button class=\"buttonRight\" onclick=\"leaveSettingForm()\">\n"
            + "            キャンセル\n"
            + "        </button>\n"
            + "    </div>"
            + "        </div>";
    });
}
//# sourceMappingURL=homePage.js.map