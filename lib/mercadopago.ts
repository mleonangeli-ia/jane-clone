import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

export const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export const preference = new Preference(mp);
export const payment = new Payment(mp);
