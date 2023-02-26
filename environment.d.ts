export {};

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			PORT: number;
			USERNAME: string;
            PASSWORD: string;
            DATABASE: string;
            DATABASE_PASSWORD: string;
            JWT_SECRET: string;
            JWT_EXPIRES_IN: string;
            JWT_COOKIE_EXPIRES_IN: number;
            EMAIL_USERNAME: string;
            EMAIL_PASSWORD: string;
            EMAIL_HOST: string;
            EMAIL_PORT: number;
            EMAIL_FROM: string;
            SENDGRID_USERNAME: string;
            SENDGRID_PASSWORD: string;
            STRIPE_SECRET_KEY: string;
            STRIPE_PUBLIC_KEY: string;
			NODE_ENV: 'development' | 'production';
            REFRESH_TOKEN_EXPIRES_IN: number;
		}
	}
}
