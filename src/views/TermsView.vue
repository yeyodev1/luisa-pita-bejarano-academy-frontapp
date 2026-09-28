<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  REFUND_MAX_PERCENT,
  REFUND_WINDOW_DAYS,
  SUPPORT_EMAIL,
  TERMS_UPDATED_LABEL,
} from '@/constants/legal'
</script>

<template>
  <main class="legal">
    <article class="legal__container container container--narrow">
      <header class="legal__header">
        <RouterLink to="/" class="legal__back">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 8H3M8 3 3 8l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Volver al sitio
        </RouterLink>
        <h1>Términos y condiciones</h1>
        <p class="legal__updated">Última actualización: {{ TERMS_UPDATED_LABEL }}</p>
      </header>

      <aside class="legal__highlight" aria-label="Resumen de la política de reembolso">
        <h2>Política de reembolso, en corto</h2>
        <ul>
          <li>
            Solo puedes pedir un reembolso dentro de los <strong>primeros {{ REFUND_WINDOW_DAYS }} días (48 horas)</strong>
            desde que adquiriste tu suscripción.
          </li>
          <li>
            El reembolso es de <strong>máximo el {{ REFUND_MAX_PERCENT }}% del monto pagado</strong>, no del total.
          </li>
          <li>Pasados esos {{ REFUND_WINDOW_DAYS }} días <strong>no hay reembolsos</strong>, ni totales ni parciales.</li>
          <li>Puedes <strong>cancelar la renovación cuando quieras</strong>: no se te vuelve a cobrar y conservas el acceso hasta el fin del mes pagado.</li>
        </ul>
      </aside>

      <section>
        <h2>1. Quiénes somos y aceptación</h2>
        <p>
          Estos términos regulan tu suscripción a la <strong>Academia y comunidad de Luisa Pita Bejarano</strong>
          (en adelante, “la comunidad”), operada por Luisa Fernanda Pita Bejarano, con domicilio en Ecuador, a través
          de luisapitabejarano.com.
        </p>
        <p>
          Al marcar la casilla de aceptación y completar el pago, declaras que eres mayor de edad, que leíste estos
          términos y que los aceptas. Si no estás de acuerdo, no completes la suscripción.
        </p>
      </section>

      <section>
        <h2>2. Qué incluye la comunidad</h2>
        <p>Mientras tu suscripción esté activa tienes acceso a:</p>
        <ul>
          <li>La academia online: entrenamientos, clases grabadas y material de los cursos.</li>
          <li>La guía de nutrición y los recursos que se publiquen para las miembros.</li>
          <li>La comunidad privada y las sesiones en vivo que se programen en el calendario.</li>
        </ul>
        <p>
          Los contenidos pueden actualizarse, agregarse o retirarse con el tiempo para mejorar el programa.
        </p>
      </section>

      <section>
        <h2>3. Suscripción mensual y renovación automática</h2>
        <ul>
          <li>La suscripción cuesta <strong>USD 47 al mes, IVA incluido</strong>.</li>
          <li>
            Se cobra <strong>automáticamente cada mes</strong> a tu tarjeta principal, en la fecha en que vence tu mes
            pagado, hasta que canceles.
          </li>
          <li>
            Si al suscribirte ya tenías acceso pagado por otro medio, no se cobra nada ese día: el primer cobro se hace
            cuando vence ese acceso.
          </li>
          <li>
            Si un cobro es rechazado, lo reintentamos hasta 3 veces, con 2 días entre cada intento, y te avisamos por
            correo. Si los intentos fallan, la suscripción se cancela.
          </li>
          <li>Si el precio cambia, te avisaremos por correo antes de que se aplique al siguiente cobro.</li>
        </ul>
      </section>

      <section>
        <h2>4. Pagos y tarjetas</h2>
        <p>
          Los pagos se procesan con <strong>Nuvei</strong>, pasarela de pagos certificada PCI DSS. Los datos de tu
          tarjeta se ingresan en un formulario de Nuvei y viajan cifrados directamente a Nuvei: nosotros nunca vemos
          ni guardamos el número completo ni el código de seguridad. Solo conservamos una referencia (token), la marca
          y los últimos 4 dígitos para mostrarte tus tarjetas y hacer los cobros mensuales.
        </p>
        <p>
          Puedes guardar varias tarjetas, elegir cuál es la principal y eliminarlas desde la sección Pagos de tu cuenta.
          Tu banco puede pedirte un código de verificación para confirmar una tarjeta o un pago.
        </p>
      </section>

      <section>
        <h2>5. Cancelación</h2>
        <p>
          Puedes cancelar la renovación en cualquier momento desde la sección Pagos de tu cuenta. Al cancelar no se
          realizan más cobros y conservas el acceso hasta el final del mes ya pagado. Cancelar no genera reembolsos por
          los días que no uses.
        </p>
      </section>

      <section id="reembolsos">
        <h2>6. Política de reembolso</h2>
        <ul>
          <li>
            El reembolso solo puede solicitarse dentro de los <strong>{{ REFUND_WINDOW_DAYS }} primeros días (48 horas)</strong>
            contados desde el momento en que adquiriste la suscripción, es decir, desde tu primer pago.
          </li>
          <li>
            El valor a reembolsar es de <strong>hasta el {{ REFUND_MAX_PERCENT }}% del monto pagado</strong>. Nunca se
            reembolsa el 100%.
          </li>
          <li>
            Fuera de ese plazo no se realizan reembolsos. Las renovaciones mensuales posteriores no son reembolsables.
          </li>
          <li>
            Para solicitarlo escribe a <strong>{{ SUPPORT_EMAIL }}</strong> desde el correo con el que te suscribiste,
            indicando tu nombre y la fecha de pago.
          </li>
          <li>
            El reembolso se devuelve a la misma tarjeta a través de Nuvei. Según tu banco, puede tardar varios días
            hábiles en verse en tu estado de cuenta.
          </li>
          <li>Al aprobarse un reembolso, la suscripción se cancela y se retira el acceso correspondiente.</li>
        </ul>
      </section>

      <section>
        <h2>7. Uso de tu cuenta y de la comunidad</h2>
        <ul>
          <li>Tu acceso es <strong>personal e intransferible</strong>: no compartas tu usuario ni tu contraseña.</li>
          <li>
            Está prohibido descargar, grabar, copiar, revender o compartir los contenidos de la academia fuera de la
            plataforma.
          </li>
          <li>
            En la comunidad se espera un trato respetuoso. Podemos suspender o cancelar el acceso, sin reembolso, a
            quien incumpla estas normas.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Salud y responsabilidad</h2>
        <p>
          Los entrenamientos y la guía de nutrición son contenidos educativos y no reemplazan una valoración ni un
          tratamiento médico, nutricional o psicológico personalizado. Antes de empezar cualquier programa de ejercicio o
          cambio de alimentación, consulta con tu médico, sobre todo si tienes una condición de salud, lesión o estás
          embarazada. Participas bajo tu propia responsabilidad y a tu propio ritmo.
        </p>
      </section>

      <section>
        <h2>9. Propiedad intelectual</h2>
        <p>
          Todos los contenidos de la comunidad (videos, textos, guías, imágenes y marca) son propiedad de Luisa Pita
          Bejarano o se usan bajo licencia. La suscripción te da un derecho de uso personal mientras esté activa, no
          la propiedad de los contenidos.
        </p>
      </section>

      <section>
        <h2>10. Datos personales</h2>
        <p>
          Tratamos tus datos según nuestras
          <RouterLink :to="{ name: 'privacy-policy' }">Políticas de privacidad</RouterLink>. Usamos tu correo para
          enviarte el acceso, los comprobantes de pago y los avisos de tu suscripción.
        </p>
      </section>

      <section>
        <h2>11. Cambios y ley aplicable</h2>
        <p>
          Podemos actualizar estos términos; la versión vigente es la publicada en esta página con su fecha de
          actualización. Los cambios importantes se comunicarán por correo. Estos términos se rigen por las leyes de la
          República del Ecuador.
        </p>
        <p>Contacto: <strong>{{ SUPPORT_EMAIL }}</strong>.</p>
      </section>
    </article>
  </main>
</template>

<style lang="scss" scoped>
.legal {
  background: $lpb-paper;
  color: $lpb-black;
  padding-block: clamp(7rem, 12vh, 9rem) clamp(4rem, 8vw, 6rem);
  min-height: 100vh;
}

.legal__container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 780px;
  margin-inline: auto;
  padding-inline: clamp(1.25rem, 5vw, 2rem);
}

.legal__header {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.legal__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: $lpb-green-dark;
  font-family: $font-mono;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  width: max-content;
  transition: color .25s ease, gap .25s ease;

  &:hover {
    color: $lpb-black;
    gap: 0.8rem;
  }
}

.legal__highlight {
  border: 1px solid rgba($lpb-amber, 0.5);
  background: rgba($lpb-amber, 0.08);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;

  h2 {
    margin-bottom: 0.5rem;
  }

  ul {
    margin: 0;
    padding-left: 1.2rem;
  }
}

h1 {
  font-family: $font-display;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(2rem, 4.5vw, 3rem);
  letter-spacing: -0.015em;
  margin: 0.25rem 0 0;
  color: $lpb-black;
}

.legal__updated {
  color: $lpb-muted;
  font-family: $font-mono;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  margin: 0;
}

section {
  border-top: 1px solid rgba($lpb-black, 0.12);
  padding-top: 1.25rem;
  scroll-margin-top: 6rem;
}

h2 {
  font-family: $font-display;
  font-style: italic;
  font-weight: 500;
  font-size: 1.2rem;
  margin: 0 0 0.75rem;
  color: $lpb-black;
}

p, li {
  color: $lpb-graphite;
  line-height: 1.65;
  font-size: 0.98rem;
}

ul {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.5rem 0;
  padding-left: 1.25rem;
  list-style: disc;
}

strong {
  color: $lpb-black;
  font-weight: 600;
}

a {
  color: $lpb-green-deep;
  text-decoration: underline;
}
</style>
