import { successResponse } from "@utils/successResponse";
import { createAndSendToken } from "@src/shared/auth";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { generateNextCode } from "@utils/codeGenerator";
import bcrypt from "bcrypt";
import ldap from "ldapjs";
import * as dotenv from "dotenv";
const prisma = new PrismaClient();
type LdapUserInfo = {
  company: string | null;
  displayName: string | null;
  location: string | null;
  department: string | null;
  mobile: string | null;
};

dotenv.config();
export const ldapLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return next(new ErrorHandler("Username and password are required", 400));
    }
    const ldapDetails: any = await authenticateLDAP(username, password);
    if (ldapDetails) {
      const existinguser = await prisma.user.findFirst({
        where: {
          username: username as string,
          OR: [{ email: username as string }],
        },
        include: {
          roles: true,
        },
      });
      const ldapInfo = extractLDAPInfo(ldapDetails);
      let unit = null;
      if (ldapInfo.company) {
        unit = await prisma.unit.findFirst({
          where: { name: ldapInfo.company },
        });
        if (!unit) {
          unit = await prisma.unit.create({
            data: {
              uuid: await generateNextCode(prisma.unit, "uuid", "UNT-", 4),
              name: ldapInfo.company ?? "Default Company",
              description: `Auto-created unit for ${ldapInfo.company}`,
            },
          });
        }
      }
      let department = null;
      if (ldapInfo.department) {
        department = await prisma.department.findFirst({
          where: { name: ldapInfo.department },
        });
        if (!department) {
          department = await prisma.department.create({
            data: {
              uuid: await generateNextCode(
                prisma.department,
                "uuid",
                "DEP-",
                4
              ),
              name: ldapInfo.department,
              description: `Auto-created department for ${ldapInfo.department}`,
            },
          });
        }
      }
      let location = null;
      if (ldapInfo.location) {
        location = await prisma.location.findFirst({
          where: { name: ldapInfo.location },
        });
        if (!location) {
          location = await prisma.location.create({
            data: {
              uuid: await generateNextCode(prisma.location, "uuid", "LOC-", 4),
              name: ldapInfo.location,
              createdBy: 1,
              updatedBy: 1,
            },
          });
        }
        if (unit) {
          await prisma.unitLocation.create({
            data: {
              unitId: unit.id,
              locationId: location.id,
              createdBy: 1,
              updatedBy: 1,
            },
          });
        }
      }
      if (!existinguser) {
        const uuid = await generateNextCode(prisma.user, "uuid", "EMP-", 5);
        const role = await prisma.role.findFirst({
          where: { name: "User" },
        });
        if (role) {
          const newuser = await prisma.user.create({
            data: {
              uuid: uuid,
              password: await bcrypt.hash(password, 10),
              username: username as string,
              email: username as string,
              name: ldapInfo.displayName,
              unitId: unit ? unit.id : null,
              departmentId: department ? department.id : null,
              locationId: location ? location.id : null,
              mobile: ldapInfo.mobile,
              roles: {
                connect: [{ id: role.id }],
              },
            },
          });
        } else {
          return next(
            new ErrorHandler("Default role not found. Contact admin.", 500)
          );
        }
      }
      if (existinguser) {
        await prisma.user.update({
          where: { id: existinguser.id },
          data: {
            email: username as string,
            name: ldapInfo.displayName,
            mobile: ldapInfo.mobile,
            unitId: unit ? unit.id : null,
            departmentId: department ? department.id : null,
            locationId: location ? location.id : null,
          },
        });
      }
      const user = await prisma.user.findFirst({
        where: { username: username as string },
        include: {
          roles: true,
        },
      });
      await prisma.loginStatus.upsert({
        where: { loginId: username as string },
        create: {
          loginId: username,
          loginDateTime: new Date(),
          loginIPAddress: Array.isArray(req.headers["x-forwarded-for"])
            ? req.headers["x-forwarded-for"].join(", ")
            : req.headers["x-forwarded-for"] ||
              req.socket.remoteAddress ||
              "unknown",
          loginBy: req.route.path,
          status: true,
        },
        update: {
          loginDateTime: new Date(),
          loginIPAddress: Array.isArray(req.headers["x-forwarded-for"])
            ? req.headers["x-forwarded-for"].join(", ")
            : req.headers["x-forwarded-for"] ||
              req.socket.remoteAddress ||
              "unknown",
        },
      });
      if (user) {
        const formattedUser: typeof user & {
          role: string | null;
          roles?: any;
        } = {
          ...user,
          role: user.roles[0]?.name || null,
          roles: user.roles,
        };
        delete formattedUser.roles;
        createAndSendToken(formattedUser, 200, res, "Login successful");
      } else {
        return next(new ErrorHandler("User not found after LDAP auth", 404));
      }
    } else {
      return next(new ErrorHandler("Something went wrong", 401));
    }
  } catch (error: unknown) {
    const errMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    if (errMessage.includes("getaddrinfo ENOTFOUND")) {
      return next(
        new ErrorHandler("LDAP server not reachable. Please contact IT.", 503)
      );
    }
    return next(new ErrorHandler(errMessage, 500));
  }
};

export const authenticateLDAP = (
  username: string,
  password: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: "ldap://10.1.0.153",
      timeout: 5000,
      connectTimeout: 5000,
    });

    client.on("error", (err) => {
      return reject(new Error(`LDAP client connection error: ${err.message}`));
    });

    const dn = username;

    client.bind(dn, password, (err) => {
      if (err) {
        console.error("LDAP bind failed:", err.message);
        client.unbind();
        return reject(new Error(`${err.message}`));
      }

      const searchOptions: ldap.SearchOptions = {
        scope: "sub",
        filter: `(userPrincipalName=${username})`,
        sizeLimit: 1,
      };

      const baseDN = "dc=abgplanet,dc=abg,dc=com";

      client.search(baseDN, searchOptions, (searchErr, searchRes) => {
        if (searchErr) {
          client.unbind();
          return reject(new Error("Failed to retrieve user data from LDAP"));
        }

        let foundUserData: Record<string, any> | null = null;

        searchRes.on("searchEntry", (entry: any) => {
          foundUserData = entry.attributes.reduce(
            (acc: Record<string, any>, attr: any) => {
              acc[attr.type] =
                attr.vals.length === 1 ? attr.vals[0] : attr.vals;
              return acc;
            },
            {}
          );
        });

        searchRes.on("end", (result) => {
          client.unbind();

          if (!foundUserData) {
            return reject(new Error("Failed to retrieve user data from LDAP"));
          }

          return resolve(foundUserData);
        });
      });
    });
  });
};

const extractLDAPInfo = (ldapDetails: any): LdapUserInfo => ({
  company: ldapDetails.company || null,
  displayName: ldapDetails.displayName || null,
  location: ldapDetails.l || null,
  department: ldapDetails.department || null,
  mobile: ldapDetails.mobile || null,
});

export const ldapAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, password } = req.body;

  const client = ldap.createClient({
    url: "ldap://10.1.0.153", // Use the same server as in old code
  });

  const dn = username; // userPrincipalName or DOMAIN\username

  client.bind(dn, password, (err) => {
    if (err) {
      console.error("LDAP bind failed:", err.message);
      client.unbind();
      return next(new Error("Invalid username or password"));
    }

    console.log("LDAP bind success");

    // Optional: log login like old Login_Status
    const loginLog = {
      username,
      datetime: new Date(),
      ip: req.ip,
      status: true,
    };

    console.log("Login log:", loginLog);

    client.unbind();
    return res.json({
      success: true,
      message: "Login successful",
      data: loginLog,
    });
  });
};
