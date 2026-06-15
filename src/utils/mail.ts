import nodemailer from "nodemailer";
import e, { Response, NextFunction } from "express";
import * as dotenv from "dotenv";
import { sendAssignmentEmail } from "../emails/assign-product.template";
import { ErrorHandler } from "./ErrorHandler";
import { sendCreateGrEmail } from "../emails/create-gr.template";
import { installationEmail } from "../emails/installation.template";
import { handoverAssetMail } from "../emails/handover.template";
import { PrismaClient } from "../../prisma/generated/prisma";
const prisma = new PrismaClient();
dotenv.config();

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 25,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
});

const superAdminEmail = async () => {
  try {
    const user = await prisma.user.findFirst({
      where: { status: true, roles: { some: { name: "Super Admin" } } },
      select: { email: true, roles: true },
      orderBy: { updatedAt: "desc" },
    });
    return user?.email || "";
  } catch (error) {
    console.error("Error fetching super admin email:", error);
    return "";
  }
};

export const sendAssignProductEmail = async (
  email: Array<string> | string,
  unitName: string,
  issuedToName: string,
  username: string,
  designation: string,
  mobile: string,
  unitAddress: string,
  issuedToEmail: string,
  Department: string,
  startDate: string,
  endDate: string,
  issuerName: string,
  productDetails: any[] = [],
  res: Response,
  next: NextFunction
) => {
  const htmlContent = await sendAssignmentEmail(
    issuedToName,
    username,
    unitName,
    designation,
    mobile,
    unitAddress,
    issuedToEmail,
    Department,
    startDate,
    endDate,
    issuerName,
    productDetails
  );
  // const superAdmin = await superAdminEmail();
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Product Assignment",
    html: htmlContent,
  };

  try {
    transport.sendMail(mailOptions, (error, info) => {
      if (error instanceof Error) {
        next(new ErrorHandler(error.message, 400));
        console.log(error.message);
      }
      console.log("Product Assignment Email sent successfully");
      return true;
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendGrEmail = async (
  email: Array<string> | string,
  orderId: string,
  invoiceNumber: string,
  invoiceDate: string,
  purchaseDate: string,
  sapGrId: string,
  purchaseId: string,
  productDetails: any[] = [],
  next: NextFunction
) => {
  const htmlContent = await sendCreateGrEmail(
    orderId,
    invoiceNumber,
    invoiceDate,
    purchaseDate,
    sapGrId,
    purchaseId,
    productDetails
  );

  // const superAdmin = await superAdminEmail();

  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: email,
    subject: "GR Created Successfully",
    html: htmlContent,
  };

  try {
    transport.sendMail(mailOptions, (error, info) => {
      if (error instanceof Error) {
        next(new ErrorHandler(error.message, 400));
        console.log(error.message);
      }
      console.log("GR Created Email sent successfully");
      return true;
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendInstallationEmail = async (
  email: Array<string> | string,
  productId: string,
  status: string,
  grId: string,
  grDate: string,
  serialNo: string,
  productName: string,
  brand: string,
  category: string,
  installationSpecification: any,
  next: NextFunction
) => {
  const htmlContent = await installationEmail(
    productId,
    status,
    grId,
    grDate,
    serialNo,
    productName,
    brand,
    category,
    installationSpecification
  );
  // const superAdmin = await superAdminEmail();

  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Installation Details",
    html: htmlContent,
  };

  try {
    transport.sendMail(mailOptions, (error, info) => {
      if (error instanceof Error) {
        next(new ErrorHandler(error.message, 400));
        console.log(error.message);
      }
      console.log("Installation Email sent successfully");
      return true;
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendHandoverEmail = async (
  email: Array<string> | string,
  employeeName: string,
  employeeCode: string,
  designation: string,
  mobile: string,
  locationName: string,
  employeeEmail: string,
  unitName: string,
  departName: string,
  assignedDste: string,
  status: string,
  attachmentUrl: string,
  productDetails: any[] = [],
  next: NextFunction
) => {
  const htmlContent = await handoverAssetMail(
    employeeName,
    employeeCode,
    designation,
    mobile,
    locationName,
    employeeEmail,
    unitName,
    departName,
    assignedDste,
    status,
    attachmentUrl,
    productDetails
  );
  // const superAdmin = await superAdminEmail();

  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Asset Handover Details",
    html: htmlContent,
  };

  try {
    transport.sendMail(mailOptions, (error, info) => {
      if (error instanceof Error) {
        next(new ErrorHandler(error.message, 400));
        console.log(error.message);
      }
      console.log("Handover Email sent successfully");
      return true;
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendTicketEmail = (
  to: string | string[],
  subject: string,
  html: string
): void => {
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
  };

  transport.sendMail(mailOptions, (error) => {
    if (error) {
      console.error(`Error sending email to ${mailOptions.to}:`, error);
    } else {
      console.log(`Email sent successfully to ${mailOptions.to}`);
    }
  });
};
