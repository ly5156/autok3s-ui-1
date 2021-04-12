<template>
  <div class="k-combo-box" :class="{ disabled: disabled }">
    <div class="k-combo-box__label">
      <label v-if="label" :for="inputId">{{label}} <sup v-if="required" class="k-form-item--required">*</sup></label>
      <tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{desc}}</template>
      </tooltip>
    </div>
    <div class="k-combo-box__prefix" v-if="$slots.prefix">
      <slot name="prefix">{{prefix}}</slot>
    </div>
    <div class="k-combo-box__trigger" ref="inputRef">
      <template v-if="editable">
        <input
          autocomplete="off"
          :disabled="disabled"
          class="k-combo-box__input"
          :class="{'k-combo-box--no-label': !label}"
          :id="inputId"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          v-bind="$attrs"
          :placeholder="placeholder"
          >
      </template>
      <template v-else>
        <input
          autocomplete="off"
          :disabled="disabled"
          class="k-combo-box__input"
          :class="{'k-combo-box--no-label': !label}"
          :id="inputId"
          v-model="queryModel"
          @focus="handleFocus"
          @keydown.down.prevent="handleKeyDown"
          @keydown.up.prevent="handleKeyUp"
          @keydown.esc.stop.prevent="handleKeyESC"
          @keydown.tab="handleKeyESC"
          @keydown.enter.stop.prevent="handleKeyEnter"
          v-bind="$attrs"
          :placeholder="modelValue"
          >
      </template>
      <k-icon v-if="loading" type="loading"></k-icon>
      <k-icon v-else type="arrow-right-blod" direction="down"></k-icon>
      <div ref="resultRef" class="k-combo-box-filter__content" :class="{'k-combo-box-filter--active': show}">
        <div v-if="loading">Loading ...</div>
        <div v-else-if="filteredOptions.length === 0">No Data</div>
        <dropdown-menu v-else>
          <dropdown-menu-item v-for="(v, index) in filteredOptions"
            :key="index"
            class="k-combo-box__option"
            :class="{'k-combo-box--selected': modelValue === v, 'k-combo-box-filter--hover': v === hoverOption}"
            @click="setValue(v)">
            {{v}}
          </dropdown-menu-item>
        </dropdown-menu>
      </div>
    </div>
    <div class="k-combo-box__suffix" v-if="$slots.suffix">
      <slot name="suffix"></slot>
    </div>
  </div>
</template>
<script>
import {computed, defineComponent, ref, customRef, watch, nextTick} from 'vue'
import { Dropdown, DropdownMenu, DropdownMenuItem }from '@/components/Dropdown'
import Tooltip from '@/components/Tooltip'
import KIcon from '@/components/Icon'
import {useIdGenerator} from '@/utils/idGenerator.js'
import usePopper from '@/composables/usePopper.js'
import useClickOutside from '@/composables/useClickOutside.js'

const getId = useIdGenerator(0, 'combo-box_');
const useMinWithModifier = (minWith = '200px') => {
  return {
    name: 'selectOptionMinWith',
    enabled: true,
    phase: 'beforeWrite',
    fn: ({ state }) => {
      const w = state.elements.reference.getBoundingClientRect().width
      state.styles.popper['min-width'] = w ? `${w + 18}px` : minWith
    }
  }
}
export default defineComponent({
  inheritAttrs: false,
  props: {
    placeholder: {
      type: String,
      default: 'Please Select...'
    },
    label: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: [String, Number, Boolean]
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    class: {
      type: [Array, String, Object]
    },
    desc: {
      type: String,
      default: ''
    },
    options: {
      type: Array,
      default() {
        return []
      }
    },
    filterable: {
      type: Boolean,
      default: false,
    },
    editable: {
      type: Boolean,
      default: true,
    }
  },
  emits: ['update:modelValue'],
  setup(props, {emit, slots}) {
    const inputId = getId()
    const show = ref(false)
    const inputRef = ref(null)
    const resultRef = ref(null)

    const filteredOptions = computed(() => {
      if (!props.filterable || !query.value) {
        return props.options
      }
      const q = query.value
      return props.options.filter((v) => v.indexOf(q) > -1)
    })
    const resultLength = computed(() => {
      return filteredOptions.value.length
    })
    const hoverOption = computed(() => {
      return filteredOptions.value[hoverIndex.value]
    })

    const minWithModifier = useMinWithModifier()
    const popperOption = {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [slots.prefix ? 0 : -10, 8],
          },
        },
        minWithModifier,
      ],
      placement: 'bottom-start'
    }
    const hoverIndex = ref(-1)
    const { create, remove, update } = usePopper(inputRef, resultRef, popperOption)
    const createPopper = () => {
      create()
      update()
    }
    watch(show, () => {
      if (show.value) {
        nextTick(() => {
          createPopper()
        })
        return
      }
      remove()
      hoverIndex.value = -1
    })

    useClickOutside(inputRef, () => {
      show.value = false
    })

    const setValue = (v) => {
      emit('update:modelValue', v)
      show.value = false
    }

    const query = ref('')
    const queryModel = computed({
      get() {
        if (show.value) {
          return query.value
        }
        return props.modelValue
      },
      set(v) {
        query.value = v
      }
    })

    const handleFocus = () => {
      query.value = ''
      show.value = true
    }
    const handleKeyDown = () => {
      if (!show.value) {
        return
      }
      if (resultLength.value === 0) {
        return
      }
      hoverIndex.value = (hoverIndex.value + 1) % resultLength.value
    }
    const handleKeyUp = () => {
       if (!show.value) {
        return
      }
      if (resultLength.value === 0) {
        return
      }
      hoverIndex.value = (hoverIndex.value - 1 + resultLength.value) % resultLength.value
    }
    const handleKeyESC = () => {
      show.value = false
    }
    const handleKeyEnter = () => {
      if (!show.value) {
        return
      }
      if (hoverOption.value) {
        emit('update:modelValue', hoverOption.value)
      }
      inputRef.value.querySelector('input')?.blur()
      show.value = false
    }

    return {
      inputId,
      setValue,
      popperOption,
      query,
      queryModel,
      handleFocus,
      filteredOptions,
      inputRef,
      resultRef,
      show,
      hoverOption,
      handleKeyDown,
      handleKeyUp,
      handleKeyESC,
      handleKeyEnter,
    }
  },
  components: {
    Dropdown,
    DropdownMenu,
    DropdownMenuItem,
    Tooltip,
    KIcon,
  }
})

function useDebouncedRef(value, delay = 200) {
  let timeout
  return customRef((track, trigger) => {
    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          value = newValue
          trigger()
        }, delay)
      }
    }
  })
}
</script>
<style>
.k-combo-box {
  display: grid;
  grid-template-areas: "label label suffix"
                       "prefix select suffix";
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr;
  padding: 8px 8px;
  background-color: var(--input-bg); 
  border-radius: var(--border-radius);
  border: solid var(--outline-width) var(--input-border);
  color: var(--input-text);
  &:not(.disabled):hover {
    background: var(--input-hover-bg);
  }
}
.k-combo-box__label {
  grid-area: label;
  color: var(--input-label);
  display: grid;
  column-gap: 10px;
  align-items: center;
  grid-template-columns: max-content auto;
  width: fit-content;
}
.k-combo-box__prefix {
  grid-area: prefix;
  color: #6c6c76;
  align-self: center;
}
.k-combo-box__suffix {
  grid-area: suffix;
  font-weight: 400;
  line-height: 1;
  border-left: thin solid #6c6c76;
  padding-left: 8px;
  display: flex;
  align-items: center;
  color: #6c6c76;
}
.k-combo-box__trigger {
  grid-area: select;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
}
.k-combo-box__input {
  cursor: pointer;
  border: none;
  background-color: transparent;
  outline: 0;
  color: var(--input-text);
  text-overflow: ellipsis;
}
.k-combo-box--no-label {
  padding: 9px 0;
}
.k-combo-box--selected, .k-combo-box-filter--hover {
  background-color: var(--dropdown-active-bg);
  color: var(--dropdown-active-text);
}

.k-combo-box-filter__content {
  display: none;
  position: absolute;
  background-color: var(--dropdown-bg);
  z-index: var(--popper-z-index);
  border: 1px solid var(--dropdown-border);
  border-radius: var(--border-radius);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  box-shadow: 0 5px 20px var(--shadow);
  max-height: 60vh;
  overflow: auto;
  min-width: 324px;
}
.k-combo-box-filter--active {
  display: block;
}
</style>