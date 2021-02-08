// the function for calling if any user validation fails
const pleaseLoginF = () => {
    localStorage.removeItem("ls_username");
    localStorage.removeItem("ls_password");
    location.href = "/pleaseLogin";
}


// getting the user data
const username = localStorage.getItem("ls_username");
const password = localStorage.getItem("ls_password");
// cls validating the user one more time
if (username != undefined && username != null && username.length > 0) {
    if (password != undefined && password != null && password.length > 0) {
        // server validating the data
        fetch("/getUserDataUHP", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        }).then(res => res.json()).then(postFetchGottenDataRes => {
            // validating the localstorage account /just a cls val, sls is already done/
            if (postFetchGottenDataRes.userData != "invalidLS") {
                location.href = "/UserHomePage";             
            } else pleaseLoginF();
        }).catch(() => null);
    } else pleaseLoginF();
} else pleaseLoginF();