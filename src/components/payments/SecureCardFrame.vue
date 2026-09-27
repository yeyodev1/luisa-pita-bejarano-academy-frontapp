<script setup lang="ts">
/**
 * Marco de confianza alrededor del formulario de tarjeta de Nuvei. El
 * formulario es un iframe servido por Nuvei (no se puede estilizar por dentro,
 * y eso es justamente lo que lo hace seguro): aquí va todo lo que lo rodea.
 */
withDefaults(
  defineProps<{
    /** id del contenedor donde el SDK de Nuvei inserta su iframe. */
    containerId: string
    environment?: 'stg' | 'prod' | null
    /** Tapa el formulario mientras se procesa el pago. */
    processing?: boolean
    processingText?: string
  }>(),
  { environment: null, processing: false, processingText: 'Procesando tu pago con Nuvei…' },
)
</script>

<template>
  <div class="secure-card">
    <header class="secure-card__head">
      <span class="secure-card__lock">
        <i class="fa-solid fa-lock" />
        Pago seguro · conexión cifrada
      </span>
      <span class="secure-card__brands" aria-label="Tarjetas aceptadas: Visa, Mastercard, American Express y Diners Club">
        <i class="fa-brands fa-cc-visa" />
        <i class="fa-brands fa-cc-mastercard" />
        <i class="fa-brands fa-cc-amex" />
        <i class="fa-brands fa-cc-diners-club" />
      </span>
    </header>

    <p v-if="environment === 'stg'" class="secure-card__test">
      <i class="fa-solid fa-flask" /> Modo de prueba: no se cobra dinero real.
    </p>

    <div class="secure-card__body">
      <div :id="containerId" class="secure-card__form" />
      <div v-if="processing" class="secure-card__processing" role="status">
        <i class="fa-solid fa-spinner fa-spin" />
        <strong>{{ processingText }}</strong>
        <span>Puede tardar hasta 30 segundos. No cierres ni recargues esta ventana.</span>
      </div>
    </div>

    <footer class="secure-card__foot">
      <i class="fa-solid fa-shield-halved" />
      <p>
        Procesado por <strong>Nuvei</strong>, pasarela certificada PCI DSS. Los datos de tu tarjeta viajan cifrados
        directo a Nuvei: nosotros nunca vemos ni guardamos el número ni el código de seguridad.
      </p>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.secure-card {
  display: flex;
  flex-direction: column;
  background: $lpb-white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  box-shadow: 0 12px 40px rgba($lpb-black, 0.06);
  overflow: hidden;
}

.secure-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid var(--border);
  background: rgba($lpb-green, 0.06);
}

.secure-card__lock {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: $font-mono;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $lpb-green-deep;
}

.secure-card__brands {
  display: inline-flex;
  gap: 0.45rem;
  font-size: 1.55rem;
  color: $lpb-graphite;

  .fa-cc-visa {
    color: #1a1f71;
  }

  .fa-cc-mastercard {
    color: #eb001b;
  }

  .fa-cc-amex {
    color: #2e77bc;
  }

  .fa-cc-diners-club {
    color: #004a97;
  }
}

.secure-card__test {
  margin: 0;
  padding: 0.55rem 1.1rem;
  font-family: $font-sans;
  font-size: 0.8rem;
  color: darken($lpb-amber, 22%);
  background: rgba($lpb-amber, 0.12);
  border-bottom: 1px solid rgba($lpb-amber, 0.3);

  i {
    margin-right: 0.35rem;
  }
}

.secure-card__body {
  position: relative;
  padding: 0.5rem 0.25rem;
}

// El SDK inserta un iframe de Nuvei: que ocupe todo el ancho y sin bordes extra.
.secure-card__form {
  min-height: 190px;

  :deep(iframe) {
    display: block;
    width: 100% !important;
    border: 0;
  }
}

.secure-card__processing {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  background: rgba($lpb-white, 0.97);
  font-family: $font-sans;
  color: $lpb-graphite;

  i {
    font-size: 1.6rem;
    color: $lpb-green-deep;
  }

  strong {
    color: $lpb-black;
  }

  span {
    font-size: 0.85rem;
  }
}

.secure-card__foot {
  display: flex;
  gap: 0.65rem;
  padding: 0.85rem 1.1rem;
  border-top: 1px solid var(--border);
  background: $lpb-cream;

  i {
    margin-top: 0.15rem;
    color: $lpb-green-deep;
  }

  p {
    margin: 0;
    font-family: $font-sans;
    font-size: 0.78rem;
    line-height: 1.5;
    color: $lpb-graphite;
  }
}
</style>
