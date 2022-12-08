const signUpForm = () => {
    window.api.invoke('sign-in-form');
};
const loginRequest = () => {
    let email = document.getElementById('username');
    let password = document.getElementById('password');
    let data = {
        email: email.value,
        password: password.value
    };
    window.api.invoke('login', data)
        .then(function (res) {
        if (res != "err") {
            localStorage.setItem("companyId", res);
            window.api.store('Set', { is_login: true });
            window.api.invoke('getFristFloorOfCompany', res)
                .then((floorId) => {
                window.api.store("Set", { floorId: floorId });
                homePage();
            });
        }
        else {
            document.getElementById('error-message').innerText = "メール或いはパスワードが存在していません。";
        }
    })
        .catch(function (err) {
        console.log("err");
    });
};
const homePage = () => {
    window.api.invoke('home-page');
};
//# sourceMappingURL=login.js.map