import nodemailer from 'nodemailer';
import {convert} from 'html-to-text';
import { User } from '../types/model/user';
import pug from 'pug';
interface IEmailOptions {
	from: string;
	to: string;
	subject: string;
	html: string;
	text: string;
}

export default class Email {
	private to: string;
	private firstName: string;
	private url: string;
	private from: string;

	constructor(user: User, url: string) {
		this.to = user.email;
		this.firstName = user.name.split(' ')[0];
		this.url = url;
		this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
	}

	private newTransport() {
		if (process.env.NODE_ENV === 'production') {
			// Sendgrid
			return nodemailer.createTransport({
				service: 'SendGrid',
				auth: {
					user: process.env.SENDGRID_USERNAME!,
					pass: process.env.SENDGRID_PASSWORD!,
				},
			});
		}

		return nodemailer.createTransport({
			host: process.env.EMAIL_HOST!,
			port: process.env.EMAIL_PORT!,
			auth: {
				user: process.env.EMAIL_USERNAME!,
				pass: process.env.EMAIL_PASSWORD!,
			},
		});
	}

	// Send the actual email
	public async send(template: string, subject: string) {
		const html = pug.renderFile(`${__dirname}/../email-templates/${template}.pug`, {
			firstName: this.firstName,
			url: this.url,
			subject,
		});
       
		const mailOptions: IEmailOptions = {
			from: this.from,
			to: this.to,
			subject,
			html,
			text: convert(html),
		};

		await this.newTransport().sendMail(mailOptions);
	}
	public async sendWelcome() {
		await this.send('welcome', 'Welcome to the Natours Family!');
	}

	public async sendPasswordReset() {
		await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
	}
}
