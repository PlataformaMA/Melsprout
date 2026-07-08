import type { Metadata } from "next";
import { LegalShell, Sec, Lista } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Aviso de Privacidad · Melsprout",
  description: "Aviso de Privacidad de Melsprout.",
};

const P = (s: string) => <p>{s}</p>;

export default function PrivacidadPage() {
  return (
    <LegalShell titulo="Aviso de Privacidad" fecha="Última actualización: 8 de julio de 2026 · Conforme a la LFPDPPP (México, 2025), compatible con la Ley 1581/2012 (Colombia) y estándares internacionales.">
      <Sec n="A" titulo="Responsable del tratamiento">
        {P(`[RAZÓN SOCIAL DE LA EMPRESA], con domicilio en [DOMICILIO LEGAL], es responsable del tratamiento de tus datos personales. Contacto de privacidad: [CORREO DE PRIVACIDAD].`)}
      </Sec>

      <Sec n="B" titulo="Qué datos recolectamos">
        <Lista>
          <li><b>Identificación y contacto:</b> nombre, correo, país, zona horaria, fecha de nacimiento (opcional), WhatsApp (opcional), foto de perfil. <i>Origen: tú, al registrarte.</i></li>
          <li><b>Perfil de creador:</b> nicho, objetivo, plataforma principal, tamaño de audiencia, @ de redes, bio, etiquetas, idiomas, intereses. <i>Origen: tú, en el onboarding.</i></li>
          <li><b>Métricas de Cuentas Conectadas:</b> nombre de usuario, foto, seguidores, alcance, interacción, reproducciones de Instagram, TikTok, YouTube y LinkedIn. <i>Origen: las APIs oficiales, con tu autorización.</i></li>
          <li><b>Uso de la Plataforma:</b> clases vistas y tiempo, retos y evidencias, XP, gemas, rachas, publicaciones, comentarios, dispositivos, IP, canal de origen. <i>Origen: automático.</i></li>
          <li><b>Pagos:</b> historial de compras y estado de suscripción. Los datos completos de tarjeta los procesa el proveedor; no los almacenamos.</li>
          <li><b>Comunicaciones:</b> tus mensajes con soporte y con el asistente de WhatsApp (si diste consentimiento).</li>
        </Lista>
        {P(`No solicitamos datos personales sensibles (salud, religión, origen étnico, etc.). Te pedimos no incluirlos en publicaciones ni evidencias.`)}
      </Sec>

      <Sec n="C" titulo="Para qué usamos tus datos (finalidades)">
        {P(`Finalidades primarias (necesarias para el servicio): crear y administrar tu cuenta · mostrar tu progreso, XP, gemas y ranking · validar retos y emitir certificaciones (incluida la verificación pública) · construir tu media kit y operar el Marketplace · procesar pagos · personalizar tu experiencia y las herramientas de IA · enviarte mensajes de servicio · prevenir fraude y mantener la seguridad · cumplir obligaciones legales.`)}
        {P(`Finalidades secundarias (requieren tu consentimiento, que puedes retirar sin afectar el servicio): enviarte marketing y novedades por correo y/o WhatsApp · usar tu contenido o resultados en publicidad de Melsprout · estudios y estadísticas con fines promocionales.`)}
      </Sec>

      <Sec n="D" titulo="Cuentas Conectadas y datos de terceros (Instagram, TikTok, YouTube, LinkedIn)">
        <Lista>
          <li>La conexión es voluntaria, por los mecanismos oficiales de cada plataforma, y nunca implica entregarnos tus contraseñas.</li>
          <li>Usamos esos datos solo para tu media kit, recomendación y verificación de campañas, personalización y estadísticas agregadas. No los vendemos.</li>
          <li><b>YouTube:</b> usa los Servicios API de YouTube. Al usarla aceptas los Términos de YouTube; el tratamiento de Google se rige por su Política de Privacidad. Puedes revocar el acceso en security.google.com/settings/security/permissions. Ciclos de actualización/eliminación no mayores a 30 días.</li>
          <li><b>Instagram (Meta) y TikTok:</b> tratamos sus datos conforme a los términos de plataforma de Meta y de TikTok for Developers, solo para las finalidades descritas.</li>
          <li><b>Desconexión y borrado:</b> al desconectar una red (o al eliminar tu cuenta), eliminamos los datos obtenidos en un máximo de 30 días. También puedes pedir el borrado a [CORREO DE PRIVACIDAD].</li>
        </Lista>
      </Sec>

      <Sec n="E" titulo="Con quién compartimos datos">
        {P(`No vendemos tus datos. Los compartimos únicamente con: (a) proveedores que nos prestan servicios bajo contrato (alojamiento, streaming de video, procesador de pagos como Stripe, envío de correos, WhatsApp, analítica); (b) Marcas del Marketplace: solo tu media kit y lo necesario para la campaña a la que apliques; (c) autoridades, cuando una ley u orden válida lo exija. Algunos proveedores están fuera de tu país; exigimos garantías contractuales equivalentes a este Aviso.`)}
      </Sec>

      <Sec n="F" titulo="Tus derechos (ARCO) y cómo ejercerlos">
        <Lista>
          <li>Tienes derecho a <b>Acceder</b>, <b>Rectificar</b>, <b>Cancelar</b> (eliminar) y <b>Oponerte</b> al tratamiento, retirar tu consentimiento y limitar el uso o divulgación.</li>
          <li><b>Cómo:</b> (1) directamente en la Plataforma (editar perfil, desconectar redes, desactivar comunicaciones, eliminar cuenta), o (2) escribiendo a [CORREO DE PRIVACIDAD] con tu nombre, el derecho que ejerces y el correo de tu cuenta. Respondemos en máximo 20 días hábiles (o menos si tu ley lo exige).</li>
          <li>Si consideras vulnerados tus derechos, puedes acudir a la autoridad de tu país (en México, la Secretaría Anticorrupción y Buen Gobierno; en Colombia, la Superintendencia de Industria y Comercio).</li>
        </Lista>
      </Sec>

      <Sec n="G" titulo="Conservación y eliminación">
        <Lista>
          <li>Conservamos tus datos mientras tu cuenta exista y sean necesarios para las finalidades de este Aviso.</li>
          <li>Al eliminar tu cuenta: borramos o anonimizamos tus datos en máximo 30 días, salvo los que debamos conservar por obligación legal (por ejemplo, registros fiscales).</li>
          <li>Los datos de Cuentas Conectadas se eliminan según la sección D. Las evidencias asociadas a certificados emitidos pueden conservarse como soporte de su validez.</li>
          <li>La página pública de verificación muestra tu nombre, certificación y fecha; puedes pedir su desactivación en cualquier momento.</li>
        </Lista>
      </Sec>

      <Sec n="H" titulo="Menores de edad">
        {P(`La Plataforma es para mayores de 16 años. Entre 16 y 17 se requiere autorización del padre, madre o tutor. Si detectamos una cuenta de un menor de 16 años, la eliminaremos junto con sus datos. Si eres tutor y crees que un menor a tu cargo creó una cuenta, escríbenos a [CORREO DE PRIVACIDAD].`)}
      </Sec>

      <Sec n="I" titulo="Cookies y seguridad">
        {P(`Cookies: usamos cookies y tecnologías similares para mantener tu sesión, recordar preferencias y medir el uso. Puedes gestionarlas desde tu navegador; deshabilitar las esenciales puede impedir el funcionamiento.`)}
        {P(`Seguridad: aplicamos medidas administrativas, técnicas y físicas razonables (cifrado en tránsito, controles de acceso, registro de actividad). Si ocurriera una vulneración que afecte significativamente tus derechos, te lo notificaremos conforme a la ley.`)}
      </Sec>

      <Sec n="J" titulo="Cambios a este Aviso">
        {P(`Publicaremos cualquier cambio en /privacidad indicando la fecha, y te avisaremos por correo y dentro de la Plataforma cuando el cambio sea sustancial. Los cambios que requieran tu consentimiento no aplicarán hasta que lo otorgues.`)}
      </Sec>
    </LegalShell>
  );
}
