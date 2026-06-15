import { Router } from "express";
import { login } from "@controllers/auth.controller";
import { loginValidator } from "@validators/auth/login.validator";
import { validate } from "@middlewares/validate.midlleware";
import { ldapLogin, ldapAuthenticate } from "@controllers/ldap/auth.controller";
export const authRouter = Router();


authRouter.post("/login", loginValidator, validate, login);
authRouter.post("/ldap/login", ldapLogin);
authRouter.post("/ldap/authenticate", ldapAuthenticate);