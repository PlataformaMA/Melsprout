import type { Metadata } from "next";
import { LegalShell, EnCorto, Sec, Lista } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Términos y Condiciones · Melsprout",
  description: "Términos y Condiciones de Uso de Melsprout.",
};

const P = (s: string) => <p>{s}</p>;

export default function TerminosPage() {
  return (
    <LegalShell titulo="Términos y Condiciones de Uso" fecha="Versión 1.0 · Última actualización: 8 de julio de 2026">
      <Sec n="1" titulo="Quiénes somos y qué aceptas">
        <EnCorto>al crear tu cuenta o usar Melsprout, aceptas estas reglas. Si no estás de acuerdo con algo, no uses la plataforma.</EnCorto>
        {P(`Melsprout (la "Plataforma") es operada por [RAZÓN SOCIAL DE LA EMPRESA], con domicilio en [DOMICILIO LEGAL] ("Melsprout", "nosotros"). Contacto legal: [CORREO LEGAL].`)}
        {P(`Estos Términos y Condiciones (los "Términos") son un contrato entre tú y Melsprout. Los aceptas: (a) al marcar la casilla de aceptación en el registro, y (b) cada vez que usas la Plataforma. El Aviso de Privacidad forma parte de estos Términos.`)}
        {P(`Edad mínima: debes tener al menos 16 años. Si tienes entre 16 y 17 años, declaras que tu padre, madre o tutor conoce y autoriza tu uso de la Plataforma y acepta estos Términos en tu nombre en lo que corresponda. Podemos pedir evidencia de esa autorización y suspender cuentas que no la acrediten.`)}
      </Sec>

      <Sec n="2" titulo="Definiciones">
        <Lista>
          <li><b>Usuario / Creador:</b> la persona que crea una cuenta en la Plataforma.</li>
          <li><b>Marca:</b> la empresa que publica campañas en el Marketplace (cuando esté activo).</li>
          <li><b>El Camino:</b> la ruta de aprendizaje por etapas, niveles y clases.</li>
          <li><b>Retos:</b> actividades prácticas que requieren enviar una evidencia (texto, enlace o imagen) para su validación.</li>
          <li><b>XP (puntos):</b> puntos de participación. No son dinero.</li>
          <li><b>Gemas:</b> moneda virtual interna canjeable solo por beneficios dentro de la Plataforma. No son dinero.</li>
          <li><b>Certificaciones:</b> los reconocimientos Creador+, Pro+ y Master+ que emite la Plataforma.</li>
          <li><b>Contenido de Usuario:</b> todo lo que publicas o envías: posts, comentarios, evidencias de retos, foto, bio.</li>
          <li><b>Servicios de Terceros:</b> Instagram, TikTok, YouTube, LinkedIn, Google, procesadores de pago y demás servicios ajenos a Melsprout.</li>
          <li><b>Cuentas Conectadas:</b> tus cuentas de redes sociales que autorizas a vincular con la Plataforma.</li>
        </Lista>
      </Sec>

      <Sec n="3" titulo="El servicio">
        <EnCorto>Melsprout es una plataforma educativa y de comunidad para creadores de contenido, con gamificación, certificaciones y — por fases — marketplace de campañas y herramientas de inteligencia artificial. El producto evoluciona: habrá funciones nuevas y otras cambiarán.</EnCorto>
        {P(`La Plataforma ofrece, según la fase de desarrollo disponible en cada momento: clases en video, retos prácticos con validación, sistema de puntos y gemas, comunidad, clases en vivo, certificaciones, conexión de redes sociales para mostrar métricas, un marketplace de colaboraciones con marcas y herramientas de creación asistida por inteligencia artificial.`)}
        {P(`Melsprout se encuentra en desarrollo activo. Podemos agregar, modificar o retirar funcionalidades en cualquier momento. Si un cambio reduce de forma sustancial un servicio que pagaste, te lo comunicaremos y podrás optar por la cancelación conforme a la cláusula 5.`)}
      </Sec>

      <Sec n="4" titulo="Tu cuenta">
        <EnCorto>una cuenta por persona, con datos reales. Tu contraseña es tuya: lo que pase en tu cuenta es tu responsabilidad. Verificar tu email desbloquea certificados y ranking.</EnCorto>
        <Lista>
          <li>Debes registrarte con información veraz y mantenerla actualizada. Está prohibido suplantar a otra persona.</li>
          <li>Una persona = una cuenta. Podemos cerrar cuentas duplicadas o creadas por medios automatizados.</li>
          <li>Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad realizada desde tu cuenta. Avísanos de inmediato a [CORREO LEGAL] si detectas un acceso no autorizado.</li>
          <li>La verificación del correo electrónico es requisito para emitir certificaciones y aparecer en el ranking público.</li>
          <li>Puedes eliminar tu cuenta en cualquier momento desde la configuración. Los efectos se describen en las cláusulas 6, 11 y 19 y en el Aviso de Privacidad.</li>
        </Lista>
      </Sec>

      <Sec n="5" titulo="Planes, pagos y reembolsos">
        <EnCorto>la Etapa 1 es gratis. Las etapas de pago se cobran por adelantado y se renuevan solas si son suscripción (te avisamos antes y puedes cancelar cuando quieras). Tienes 7 días para pedir reembolso si no has consumido el contenido.</EnCorto>
        <Lista>
          <li><b>Servicios gratuitos:</b> la Etapa 1 del Camino, la comunidad y la gamificación son gratuitas. «Gratis» no genera derecho adquirido: podemos modificar el alcance gratuito con aviso previo razonable.</li>
          <li><b>Servicios de pago:</b> las Etapas 2 y 3 y los planes (Individual, Dueto, Grupo, Familia, Empresa) se cobran por adelantado en la moneda y monto mostrados en el checkout, más los impuestos aplicables.</li>
          <li><b>Renovación automática:</b> las suscripciones se renuevan automáticamente por períodos iguales. Te avisaremos por correo antes de cada renovación y puedes cancelar en cualquier momento desde tu cuenta; la cancelación surte efecto al final del período pagado.</li>
          <li><b>Procesador de pagos:</b> los pagos son procesados por terceros (por ejemplo, Stripe). Melsprout no almacena los números completos de tu tarjeta.</li>
          <li><b>Reembolsos:</b> puedes solicitar el reembolso de una compra dentro de los 7 días naturales siguientes, siempre que no hayas completado más del 20% del contenido del nivel comprado. Los derechos de retracto que las leyes de consumo de tu país te otorguen se respetan siempre y prevalecen sobre esta política.</li>
          <li><b>Cambios de precio:</b> se anuncian con al menos 15 días de anticipación y aplican a partir de la siguiente renovación o compra. Nunca cambian el precio de un período ya pagado.</li>
          <li><b>Cupones y descuentos por retos:</b> los descuentos que se desbloquean al aprobar retos son personales, no acumulables con otras promociones salvo que se indique lo contrario, y tienen la vigencia que se muestre al emitirse.</li>
        </Lista>
      </Sec>

      <Sec n="6" titulo="XP, gemas y gamificación">
        <EnCorto>los puntos y las gemas son parte del juego. No son dinero, no se compran ni se venden, no se transfieren y no se pueden cambiar por efectivo. Si haces trampa, se ajustan o se pierden.</EnCorto>
        <Lista>
          <li>El XP, las gemas, las rachas, las insignias, los niveles y el ranking son funcionalidades de juego sin valor monetario. No son dinero electrónico, criptomoneda, depósito ni instrumento financiero de ningún tipo.</li>
          <li>No pueden venderse, comprarse con dinero fuera de los mecanismos oficiales de la Plataforma (si existieran), transferirse entre cuentas, heredarse ni canjearse por dinero en efectivo.</li>
          <li>Melsprout puede ajustar las reglas de otorgamiento, los valores, los topes y los beneficios canjeables para mantener el equilibrio del sistema, avisando dentro de la Plataforma.</li>
          <li><b>Anti-fraude:</b> si detectamos manipulación (cuentas falsas para darse likes, automatización, compraventa de evidencias, etc.) podemos retirar XP, gemas, insignias, posiciones de ranking y certificaciones obtenidas mediante fraude, y suspender la cuenta conforme a la cláusula 9.</li>
          <li>Al eliminarse una cuenta (por el usuario o por sanción), el XP y las gemas se extinguen sin derecho a compensación. Las certificaciones legítimamente obtenidas se rigen por la cláusula 11.</li>
        </Lista>
      </Sec>

      <Sec n="7" titulo="Contenido de Melsprout y propiedad intelectual">
        <EnCorto>las clases, textos, marcas y diseño son nuestros o de nuestros licenciantes. Puedes usarlos para aprender tú; no puedes copiarlos, descargarlos, revenderlos ni compartir tu cuenta.</EnCorto>
        <Lista>
          <li>Todo el contenido de la Plataforma (videos de clases, guías, plantillas, textos, metodologías, software, diseño, logos y la marca Melsprout) pertenece a Melsprout o a sus licenciantes y está protegido por las leyes de propiedad intelectual.</li>
          <li>Te otorgamos una licencia personal, limitada, no exclusiva y no transferible para acceder al contenido con fines de aprendizaje propio, mientras tu cuenta esté activa y al día.</li>
          <li>Está prohibido: descargar o grabar las clases (salvo los materiales marcados como descargables), reproducirlas públicamente, revenderlas, compartir el acceso a tu cuenta, o usar el contenido para crear cursos o productos competidores.</li>
          <li>Los materiales descargables son para tu uso personal o el de tu negocio, no para redistribución.</li>
        </Lista>
      </Sec>

      <Sec n="8" titulo="Tu contenido (lo que publicas y las evidencias de tus retos)">
        <EnCorto>lo que publicas sigue siendo tuyo. Nos das permiso para mostrarlo dentro de la plataforma (es necesario para que funcione) y solo usaremos tu contenido en publicidad si nos dices que sí.</EnCorto>
        <Lista>
          <li><b>Tu contenido es tuyo.</b> Conservas todos los derechos sobre lo que publicas en la comunidad y las evidencias que envías en los retos.</li>
          <li>Para que la Plataforma pueda funcionar, nos concedes una licencia mundial, gratuita y no exclusiva para alojar, reproducir, adaptar técnicamente (por ejemplo, redimensionar) y mostrar tu contenido dentro de la Plataforma.</li>
          <li><b>Uso promocional:</b> solo usaremos tu contenido, nombre o resultados en publicidad o redes de Melsprout con tu consentimiento expreso, dándote siempre el crédito.</li>
          <li>Declaras que tu contenido es tuyo o tienes permiso para publicarlo, y que no infringe derechos de terceros. Eres el único responsable de lo que publicas.</li>
          <li>Si eliminas contenido, dejará de mostrarse en la Plataforma. Pueden conservarse copias temporales en respaldos y las evidencias asociadas a certificaciones emitidas.</li>
        </Lista>
      </Sec>

      <Sec n="9" titulo="Normas de la comunidad y sanciones">
        <EnCorto>sé respetuoso, no hagas spam, no publiques nada ilegal ni ofensivo y no hagas trampa. Si rompes las reglas: aviso, suspensión de 7 días o expulsión, según la gravedad. Puedes apelar.</EnCorto>
        {P(`Está prohibido: (a) acoso, insultos, discriminación o incitación al odio; (b) spam, autopromoción no autorizada, esquemas piramidales o cadenas; (c) contenido ilegal, sexual, violento o que infrinja derechos de terceros; (d) desinformación deliberada o suplantación; (e) recolectar datos de otros usuarios; (f) manipular la gamificación (cláusula 6); (g) interferir técnicamente con la Plataforma (ingeniería inversa, scraping, ataques, bots); (h) usar la Plataforma para fines distintos a los previstos.`)}
        {P(`Moderación: los usuarios pueden reportar contenido. Melsprout puede retirar contenido que infrinja estas normas y aplicar, según la gravedad y la reincidencia: advertencia, suspensión temporal (por ejemplo, 7 días) o cierre definitivo de la cuenta. En infracciones graves el cierre puede ser inmediato.`)}
        {P(`Apelación: puedes apelar cualquier sanción escribiendo a [CORREO LEGAL] dentro de los 15 días siguientes; responderemos en un plazo razonable.`)}
      </Sec>

      <Sec n="10" titulo="Conexión de tus redes sociales y extracción de métricas">
        <EnCorto>tú decides si conectas tus redes. Nunca te pedimos tu contraseña: la conexión es por el mecanismo oficial de cada plataforma. Solo leemos métricas (seguidores, alcance, interacción) para armar tu media kit, recomendarte campañas y personalizar tu experiencia. Puedes desconectarlas cuando quieras y tus datos de esa red se borran.</EnCorto>
        <p className="font-semibold text-text">10.1 Qué conectas y para qué</p>
        <Lista>
          <li>Puedes vincular voluntariamente tus cuentas de Instagram, TikTok, YouTube y LinkedIn mediante los mecanismos oficiales de autorización de cada plataforma (OAuth). Nunca te pediremos tus contraseñas.</li>
          <li>Con tu autorización, accedemos únicamente a datos de perfil y métricas: nombre de usuario, foto, número de seguidores, alcance, interacción, reproducciones y datos equivalentes.</li>
          <li>Finalidades: (a) construir tu media kit; (b) verificar requisitos y recomendarte campañas; (c) personalizar recomendaciones y herramientas de IA; (d) validar evidencias de retos; (e) generar estadísticas agregadas y anónimas.</li>
          <li>No hacemos: publicar en tus redes sin tu acción expresa, leer tus mensajes privados, ni vender tus datos a terceros.</li>
        </Lista>
        <p className="font-semibold text-text">10.2 Control y desconexión</p>
        <Lista>
          <li>Puedes desconectar cualquier Cuenta Conectada en todo momento desde la configuración. Al desconectarla, dejamos de recibir datos de esa red y eliminamos los datos obtenidos de ella en un máximo de 30 días, salvo obligación legal.</li>
          <li>Tú controlas qué métricas se muestran públicamente en tu media kit.</li>
          <li>Las métricas provienen de Servicios de Terceros: no garantizamos su exactitud, disponibilidad ni continuidad.</li>
        </Lista>
        <p className="font-semibold text-text">10.3 YouTube (requisitos de Google)</p>
        <Lista>
          <li>La conexión con YouTube utiliza los Servicios API de YouTube. Al usarla aceptas los Términos de Servicio de YouTube: https://www.youtube.com/t/terms.</li>
          <li>El tratamiento por Google se rige por su Política de Privacidad: http://www.google.com/policies/privacy.</li>
          <li>Puedes revocar el acceso de Melsprout en: https://security.google.com/settings/security/permissions.</li>
          <li>Los datos autorizados de YouTube se actualizan o eliminan en períodos no mayores a 30 días sin refresco.</li>
        </Lista>
        <p className="font-semibold text-text">10.4 Instagram (Meta) y TikTok</p>
        <Lista>
          <li>La conexión con Instagram usa las interfaces oficiales de Meta; la de TikTok, las herramientas de TikTok for Developers, y se rigen también por sus términos.</li>
          <li>Tratamos estos datos únicamente para las finalidades de la cláusula 10.1; no los vendemos ni divulgamos para publicidad de terceros.</li>
          <li>Las instrucciones para eliminar los datos están en el Aviso de Privacidad y se cumplen al eliminar tu cuenta.</li>
        </Lista>
      </Sec>

      <Sec n="11" titulo="Certificaciones">
        <EnCorto>nuestros certificados acreditan que completaste el programa y sus retos. Son verificables con un código QR, pero no son títulos académicos oficiales. La página de verificación muestra tu nombre; puedes pedir que se retire.</EnCorto>
        <Lista>
          <li>Las Certificaciones (Creador+, Pro+, Master+) acreditan la finalización de un programa formativo de Melsprout. No son títulos ni grados con reconocimiento oficial, ni garantizan resultados.</li>
          <li>Cada certificado incluye un código QR que enlaza a una página pública de verificación con tu nombre, la certificación, la fecha y su validez. Al aceptar estos Términos consientes esa publicación.</li>
          <li>Puedes solicitar que la página de verificación se desactive escribiendo a [CORREO DE PRIVACIDAD] o desde la configuración. El PDF sigue siendo tuyo.</li>
          <li>Melsprout puede revocar certificaciones obtenidas mediante fraude o evidencias falsas.</li>
        </Lista>
      </Sec>

      <Sec n="12" titulo="Retos, resultados y expectativas de ingresos">
        <EnCorto>te enseñamos métodos que funcionan, pero tus resultados dependen de ti, de tu esfuerzo y de tu mercado. Nadie puede prometerte seguidores, ventas ni ingresos — y nosotros no lo hacemos.</EnCorto>
        <Lista>
          <li>Las evidencias que envías deben ser veraces y propias. Enviar evidencias falsas es causal de sanción y revocación de recompensas y certificados.</li>
          <li>La Plataforma tiene fines educativos. No garantizamos resultados específicos. Los casos de éxito muestran resultados posibles, no promesas.</li>
          <li>Cualquier decisión de negocio es tu responsabilidad. La Plataforma no presta asesoría financiera, legal ni fiscal.</li>
        </Lista>
      </Sec>

      <Sec n="13" titulo="Marketplace de campañas (aplicable cuando se active)">
        <EnCorto>el Marketplace conecta creadores con marcas. El contrato de cada campaña es entre la marca y el creador; nosotros ponemos la tecnología, retenemos el pago hasta que la entrega se aprueba y cobramos 15% de comisión. Está prohibido cerrar el trato por fuera.</EnCorto>
        <Lista>
          <li><b>Rol de Melsprout:</b> somos un intermediario tecnológico. El contrato es entre la Marca y el Creador; Melsprout no es parte, no emplea a los creadores.</li>
          <li><b>Requisito de acceso:</b> Certificación Creador+ vigente y cumplir los requisitos de cada campaña.</li>
          <li><b>Pagos protegidos:</b> la Marca deposita al asignar la campaña. El pago (menos comisión) se libera cuando la Marca aprueba, o automáticamente si no responde en 7 días. Hasta 2 rondas de revisión.</li>
          <li><b>Comisión:</b> 15% sobre el valor de cada campaña.</li>
          <li><b>Elusión prohibida:</b> cerrar por fuera una colaboración originada en la Plataforma, durante la campaña y los 6 meses siguientes, es causal de suspensión y cobro de la comisión eludida.</li>
          <li><b>Impuestos:</b> cada parte es responsable de los suyos.</li>
          <li><b>Disputas:</b> ofrecemos un proceso interno de resolución vinculante dentro de la Plataforma. <b>Reseñas:</b> honestas y basadas en la experiencia real.</li>
        </Lista>
      </Sec>

      <Sec n="14" titulo="Herramientas de inteligencia artificial (cuando se activen)">
        <EnCorto>la IA te ayuda a crear guiones e ideas, pero es una herramienta: revisa lo que genera antes de publicarlo. Lo que crees con ella es tuyo; el uso que le des es tu responsabilidad.</EnCorto>
        <Lista>
          <li>Las herramientas de IA generan sugerencias a partir de tu contexto. Pueden contener errores: debes revisarlas antes de usarlas.</li>
          <li>El contenido que generes es tuyo para tu actividad como creador. No garantizamos que sea único ni que cumpla las normas de cada red o de publicidad.</li>
          <li>Prohibido usar la IA para contenido ilegal, engañoso, difamatorio o que infrinja derechos.</li>
          <li>Tus entradas y salidas se tratan conforme al Aviso de Privacidad.</li>
        </Lista>
      </Sec>

      <Sec n="15" titulo="Comunicaciones">
        <EnCorto>te escribimos por correo y notificaciones para acompañarte. Solo te escribimos por WhatsApp si nos diste tu número y tu permiso. Puedes darte de baja de lo promocional cuando quieras.</EnCorto>
        <Lista>
          <li><b>Mensajes de servicio</b> (verificación, seguridad, cambios de términos, estados de retos y pagos): necesarios para operar tu cuenta.</li>
          <li><b>Mensajes de marketing:</b> puedes desactivarlos en cualquier momento desde la configuración o el enlace de baja.</li>
          <li><b>WhatsApp:</b> solo si diste tu número y consentimiento. Responde «BAJA» o desactívalo en configuración.</li>
        </Lista>
      </Sec>

      <Sec n="16" titulo="Privacidad y datos personales">
        {P(`El tratamiento de tus datos personales se describe en el Aviso de Privacidad (disponible en /privacidad), que incluye qué datos recolectamos, para qué, con quién se comparten, cuánto tiempo se conservan y cómo ejercer tus derechos ARCO, incluida la eliminación total de tu cuenta.`)}
      </Sec>

      <Sec n="17" titulo="Disponibilidad del servicio">
        <EnCorto>trabajamos para que la plataforma funcione siempre, pero como todo servicio de internet, puede tener mantenimientos y fallas. No garantizamos disponibilidad perfecta.</EnCorto>
        {P(`La Plataforma se ofrece "tal cual" y "según disponibilidad". Podemos realizar mantenimientos y no somos responsables por interrupciones causadas por terceros (hosting, redes sociales, procesadores de pago), fuerza mayor o caso fortuito. Ninguna parte limita derechos irrenunciables del consumidor.`)}
      </Sec>

      <Sec n="18" titulo="Limitación de responsabilidad e indemnidad">
        <EnCorto>respondemos por nuestro servicio, pero no por lo que hagan terceros ni por decisiones de negocio que tomes tú. Nuestra responsabilidad total tiene un tope razonable, salvo donde la ley no lo permita.</EnCorto>
        {P(`En la máxima medida permitida por la ley: (a) Melsprout no responde por daños indirectos, lucro cesante o pérdida de datos; (b) su responsabilidad total se limita al monto pagado por el usuario en los 12 meses anteriores (o, si no pagó, a USD $100); (c) nada excluye la responsabilidad que legalmente no pueda excluirse.`)}
        {P(`Aceptas mantener indemne a Melsprout frente a reclamaciones de terceros originadas en tu contenido, tu incumplimiento de estos Términos o tu infracción de derechos de terceros.`)}
      </Sec>

      <Sec n="19" titulo="Terminación">
        <EnCorto>puedes irte cuando quieras. Nosotros podemos cerrar cuentas que rompan las reglas. Si cerramos tu cuenta sin causa y habías pagado, te devolvemos la parte proporcional.</EnCorto>
        <Lista>
          <li><b>Por ti:</b> puedes cancelar suscripciones y/o eliminar tu cuenta en cualquier momento desde la configuración.</li>
          <li><b>Por nosotros, con causa:</b> podemos suspender o cerrar tu cuenta por incumplimiento, sin reembolso de períodos consumidos, salvo que la ley disponga otra cosa.</li>
          <li><b>Por nosotros, sin causa:</b> si descontinuamos el servicio, reembolsamos la parte proporcional no disfrutada.</li>
          <li><b>Efectos:</b> se extinguen las licencias, el XP y las gemas. Tus certificados PDF siguen siendo tuyos. Tus datos se eliminan conforme al Aviso de Privacidad.</li>
        </Lista>
      </Sec>

      <Sec n="20" titulo="Cambios a estos Términos">
        {P(`Podemos modificar estos Términos. Los cambios sustanciales se anunciarán con al menos 15 días de anticipación por correo y dentro de la Plataforma, indicando la fecha de entrada en vigor. Si continúas usando la Plataforma después de esa fecha, aceptas los nuevos Términos; si no, puedes cancelar conforme a la cláusula 19 antes de su entrada en vigor.`)}
      </Sec>

      <Sec n="21" titulo="Ley aplicable y resolución de disputas">
        <EnCorto>primero intentamos resolverlo contigo directamente. Si no se puede, aplican la ley y los tribunales del país donde está constituida la empresa — sin quitarte los derechos de consumidor de tu propio país.</EnCorto>
        {P(`Estos Términos se rigen por las leyes de [PAÍS DE CONSTITUCIÓN]. Cualquier controversia se someterá a [TRIBUNALES COMPETENTES / ARBITRAJE]. Lo anterior no priva a los consumidores de la protección de las normas imperativas ni de la jurisdicción de consumo de su país de residencia.`)}
      </Sec>

      <Sec n="22" titulo="Contacto y disposiciones finales">
        {P(`Contacto: [CORREO LEGAL] · Privacidad: [CORREO DE PRIVACIDAD] · Domicilio: [DOMICILIO LEGAL].`)}
        {P(`Si alguna cláusula se declara inválida, las demás conservan su vigencia. La falta de ejercicio de un derecho no implica renuncia. No puedes ceder tu cuenta ni estos Términos; Melsprout puede cederlos en caso de reorganización empresarial. Estos Términos, junto con el Aviso de Privacidad y las condiciones particulares que aceptes, constituyen el acuerdo completo entre las partes.`)}
      </Sec>
    </LegalShell>
  );
}
