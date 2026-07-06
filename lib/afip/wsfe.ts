/**
 * AFIP WSFE — Web Service de Facturación Electrónica
 * Solicita el CAE (Código de Autorización Electrónico) para un comprobante.
 */
import { getAfipToken, type AfipCredentials } from "./wsaa";
import { format } from "date-fns";

const WSFE_HOMO = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx";
const WSFE_PROD = "https://servicios1.afip.gov.ar/wsfev1/service.asmx";

function wsfeUrl(env: string) {
  return env === "produccion" ? WSFE_PROD : WSFE_HOMO;
}

// IVA codes: 5 = 21%, 4 = 10.5%, 3 = 0%, etc.
const IVA_CODES: Record<number, number> = {
  0: 3,    // 0% → código 3
  10: 4,   // 10.5% → código 4
  21: 5,   // 21% → código 5
};

export type FECAERequest = {
  cuit:          string;
  puntoVenta:    number;
  tipoComp:      number;   // 11 = Factura C, 6 = Factura B, 1 = Factura A
  cbteDesde:     number;   // número de comprobante
  cbteHasta:     number;
  concepto:      number;   // 1=Productos, 2=Servicios, 3=Productos y Servicios
  importeTotal:  number;   // en pesos (no centavos)
  importeNeto:   number;
  importeIVA:    number;
  alicuotaIVA:   number;   // porcentaje
  moneda:        string;   // "PES" = Pesos
  fechaCbte:     Date;
};

export type FECAEResponse = {
  cae:      string;
  caeVenc:  Date;
  cbteNro:  number;
};

function buildFECAESoap(
  cuit: string,
  token: string,
  sign: string,
  req: FECAERequest,
) {
  const fecha = format(req.fechaCbte, "yyyyMMdd");
  const ivaCode = IVA_CODES[req.alicuotaIVA] ?? 3;

  const ivaSection = req.importeIVA > 0 ? `
            <AlicIva>
              <AlicIva>
                <Id>${ivaCode}</Id>
                <BaseImp>${req.importeNeto.toFixed(2)}</BaseImp>
                <Importe>${req.importeIVA.toFixed(2)}</Importe>
              </AlicIva>
            </AlicIva>` : "";

  return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <FECAESolicitar xmlns="http://ar.gov.afip.dif.FEV1/">
      <Auth>
        <Token>${token}</Token>
        <Sign>${sign}</Sign>
        <Cuit>${cuit}</Cuit>
      </Auth>
      <FeCAEReq>
        <FeCabReq>
          <CantReg>1</CantReg>
          <PtoVta>${req.puntoVenta}</PtoVta>
          <CbteTipo>${req.tipoComp}</CbteTipo>
        </FeCabReq>
        <FeDetReq>
          <FECAEDetRequest>
            <Concepto>${req.concepto}</Concepto>
            <DocTipo>99</DocTipo>
            <DocNro>0</DocNro>
            <CbteDesde>${req.cbteDesde}</CbteDesde>
            <CbteHasta>${req.cbteHasta}</CbteHasta>
            <CbteFch>${fecha}</CbteFch>
            <ImpTotal>${req.importeTotal.toFixed(2)}</ImpTotal>
            <ImpTotConc>0.00</ImpTotConc>
            <ImpNeto>${req.importeNeto.toFixed(2)}</ImpNeto>
            <ImpOpEx>0.00</ImpOpEx>
            <ImpIVA>${req.importeIVA.toFixed(2)}</ImpIVA>
            <ImpTrib>0.00</ImpTrib>
            <MonId>${req.moneda}</MonId>
            <MonCotiz>1</MonCotiz>${ivaSection}
          </FECAEDetRequest>
        </FeDetReq>
      </FeCAEReq>
    </FECAESolicitar>
  </soap12:Body>
</soap12:Envelope>`;
}

export async function solicitarCAE(
  creds: AfipCredentials,
  req: FECAERequest,
): Promise<FECAEResponse> {
  const { token, sign } = await getAfipToken(creds);
  const url  = wsfeUrl(creds.env);
  const soap = buildFECAESoap(creds.cuit, token, sign, req);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/soap+xml; charset=utf-8",
      "SOAPAction": "http://ar.gov.afip.dif.FEV1/FECAESolicitar",
    },
    body: soap,
  });

  if (!res.ok) throw new Error(`WSFE HTTP error: ${res.status}`);

  const xml = await res.text();

  // Check for errors
  const errMsg = xml.match(/<Msg>([\s\S]*?)<\/Msg>/)?.[1];
  const resultado = xml.match(/<Resultado>([\s\S]*?)<\/Resultado>/)?.[1];
  if (resultado === "R" && errMsg) {
    throw new Error(`AFIP rechazó el comprobante: ${errMsg}`);
  }

  const cae     = xml.match(/<CAE>([\s\S]*?)<\/CAE>/)?.[1]?.trim();
  const caeVenc = xml.match(/<CAEFchVto>([\s\S]*?)<\/CAEFchVto>/)?.[1]?.trim();
  const cbteNro = xml.match(/<CbteDesde>([\s\S]*?)<\/CbteDesde>/)?.[1]?.trim();

  if (!cae) {
    const obs = xml.match(/<Msg>([\s\S]*?)<\/Msg>/g)?.join(", ");
    throw new Error(obs ?? "AFIP no devolvió CAE");
  }

  return {
    cae,
    caeVenc:  caeVenc ? new Date(`${caeVenc.slice(0,4)}-${caeVenc.slice(4,6)}-${caeVenc.slice(6,8)}`) : new Date(),
    cbteNro:  parseInt(cbteNro ?? "0", 10),
  };
}

/** Get the last authorized invoice number for a punto de venta + tipo */
export async function getUltimoComprobante(
  creds: AfipCredentials,
  puntoVenta: number,
  tipoComp: number,
): Promise<number> {
  const { token, sign } = await getAfipToken(creds);
  const url = wsfeUrl(creds.env);

  const soap = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <FECompUltimoAutorizado xmlns="http://ar.gov.afip.dif.FEV1/">
      <Auth><Token>${token}</Token><Sign>${sign}</Sign><Cuit>${creds.cuit}</Cuit></Auth>
      <PtoVta>${puntoVenta}</PtoVta>
      <CbteTipo>${tipoComp}</CbteTipo>
    </FECompUltimoAutorizado>
  </soap12:Body>
</soap12:Envelope>`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/soap+xml; charset=utf-8" },
    body: soap,
  });

  const xml = await res.text();
  const nro = xml.match(/<CbteNro>([\s\S]*?)<\/CbteNro>/)?.[1]?.trim();
  return parseInt(nro ?? "0", 10);
}
