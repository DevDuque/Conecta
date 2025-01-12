import { VALIDATE_PASSWORD_RESET_WORD, PROJECT_URL } from "../../js/constants.js";
import { Organization } from "../../js/models/organization.js";
import { sendEmail } from "../../js/envio-email.js";
import { Candidate } from "../../js/models/candidate.js";
import {hashPassword} from "../../js/utils.js";
import {Session} from "../../js/models/session.js";
import {Admin} from "../../js/models/admin.js";

document.getElementById("entrar").addEventListener("click", handleGetIn);

document.addEventListener("DOMContentLoaded", function () {
    document.querySelector("#email").addEventListener("input", function (event) {
      var email = event.target.value.trim();
      var adminInput = document.querySelector("#admin-input");
      var adminState = document.querySelector("#admin");
      var adminShown = document.querySelector(".options-div");
  
      if (email === "admin" || email === "admin@admin.com") {
        adminInput.style.display = "flex";

        adminState.checked = true;

        adminShown.style.flexDirection = "column"
        adminShown.style.justifyContent = "center"
      } else {
        adminInput.style.display = "none";

        adminState.checked = false;

        adminShown.style.flexDirection = "row"
        adminShown.style.justifyContent = "space-around"
      }
    });
  });
  
async function encode(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashedArray = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashedArray)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateToken(email) {
    const hash = await encode(`${email}---${VALIDATE_PASSWORD_RESET_WORD}`);
    return `${email}-${hash}`;
}

async function getOrganizationIdIfEmailIsRegistered(email) {
    const ong = new Organization()
    const response = await ong.findByEmail(email);
    if(response.length > 0) {
        return response[0].id;
    }
    console.log("Email não cadastrado.")
    return null;
}

async function handleForgotPassword() {
    const email = document.getElementById("email").value;

    const regex = /\S+@\S+\.\S+/;
    if(!regex.test(email)) {
        alert("Email inválido.");
        return;
    }

    const organizationId = await getOrganizationIdIfEmailIsRegistered(email);

    if(organizationId) {
        const token = await generateToken(organizationId);
        await sendEmail(
            email,
            "Recuperação de senha",
            `Para recuperar sua senha, clique no link: ${PROJECT_URL}/pages/recuperar-senha/recuperar-senha.html?token=${token}`
        );
    }

    alert("Email de recuperação de senha enviado.");
    window.location.href = "../login/login.html";
}

async function handleGetIn(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("senha").value;

    const regex = /\S+@\S+\.\S+/;
    if(!regex.test(email)) {
        alert("Email inválido.");
        return;
    }

    if(password.length <= 0) {
        alert("Senha não pode ser vazia");
        return;
    }

    if(password.length < 6) {
        alert("Senha deve ter no mínimo 6 caracteres");
        return;
    }

    const userType = document.querySelector('input[name="user_type"]:checked')?.value

    let userEntity;
    switch(userType) {
        case "organization":
            userEntity = new Organization();
            break;
        case "candidate":
            userEntity = new Candidate();
            break;
        case "admin":
            userEntity = new Admin();
            break
        default:
            alert("Selecione o tipo de usuário.");
            return;
    }

    const isAuthenticated = await authenticate(userEntity, email, password)
    if(isAuthenticated) {
        const user = await userEntity.findByEmail(email);
        const domain = new Session(user[0].id, userType);
        const session = await domain.create();

        window.localStorage.setItem("token", session[0].token);
        window.localStorage.setItem("userType", session[0].userType);

        if(userType === "organization") {
            window.location.href = "../administrar-demandas/administrar-demandas.html";
        }

        if(userType === "candidate") {
            window.location.href = "../pagina-do-voluntario/pagina-do-voluntario.html";
        }

        if(userType === "admin") {
            window.location.href = "../pagina-do-admin/pagina-do-admin.html";
        }

        alert("Login realizado com sucesso.")
    } else {
        alert("Email ou senha incorretos.");
        window.location.href = "login.html";
    }
}

async function authenticate(userEntity, email, password) {
    try {
    const user = await userEntity.findByEmail(email);
    if (!user || user.length === 0) {
        return false;
    }
    const hash = await hashPassword(password);
    return user[0].password === hash;
    } catch (error) {
        console.error("Erro ao autenticar usuário", error);
        return false;
    }
}
