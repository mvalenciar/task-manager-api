import nodemailer from "nodemailer";

//1. Configuración de transporte de email
export const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
	port: Number(process.env.SMTP_PORT) || 2525,
	auth: {
		user: process.env.SMTP_USER || "tu_usuario_de_mailtrap",
		pass: process.env.SMTP_PASS || "tu_clave_de_mailtrap",
	},
});

//función para enviar email de activación
export const sendVerificationEmail = async (
	email: string,
	alias: string,
	token: string,
) => {
	const verificationUrl = `${process.env.APP_URL || "http://localhost:5173"}/verify-email?token=${token}`;

	await transporter.sendMail({
		from: '"Task Manager 🚀" <noreply@taskmanager.com>',
		to: email,
		subject: "🔑 Activa tu cuenta - Task Manager",
		html: `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded: 8px;">
				<h2 style="color: #18181b;">¡Hola, @${alias}! 👋</h2>
				<p style="color: #3f3f46; line-height: 1.5;">
					Gracias por registrarte en Task Manager. Para empezar a gestionar tus tareas y asegurar tu espacio de trabajo, necesitas confirmar tu correo electrónico.
				</p>
				<div style="margin: 30px 0; text-align: center;">
					<a href="${verificationUrl}" style="background-color: #18181b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
						Verificar Correo Electrónico
					</a>
				</div>
				<p style="color: #71717a; font-size: 12px;">
					Este enlace vencerá en 24 horas. Si tú no creaste esta cuenta, puedes ignorar este mensaje de forma segura.
				</p>
			</div>
		`,
	});
};
