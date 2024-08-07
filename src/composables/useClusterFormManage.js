import useFormManage from './useFormManage.js'
import jsyaml from 'js-yaml'
import { Base64 } from 'js-base64'

export default function useClusterFormManage() {
  const { getForm, validate } = useFormManage()
  const needDecodeConfigKeys = ['server-config-file-content', 'agent-config-file-content']
  const validateForm = (form, schema) => {
    const configRequiredFields = Object.entries(schema.config)
      // eslint-disable-next-line no-unused-vars
      .filter(([k, v]) => v?.required)
      .map(([k]) => k)

    const optionsRequiredFields = Object.entries(schema.options)
      // eslint-disable-next-line no-unused-vars
      .filter(([k, v]) => v?.required)
      .map(([k]) => k)
    if (!form) {
      return []
    }
    const requiredErrors = [
      ...configRequiredFields.reduce((t, c) => {
        if (!form.config[c]) {
          t.push(`"${c}" is required`)
        }
        return t
      }, []),
      ...optionsRequiredFields.reduce((t, c) => {
        if (!form.options[c]) {
          t.push(`"${c}" is required`)
        }
        return t
      }, [])
    ]
    const errors = validate(schema)
    // validate registry
    const registry = form?.config?.['registry-content']
    if (registry?.trim()) {
      try {
        jsyaml.load(registry)
      } catch (err) {
        errors.push(err)
      }
    }
    let serverConfig = form?.config?.['server-config-file-content'] ?? ''
    if (needDecodeConfigKeys.includes('server-config-file-content')) {
      serverConfig = Base64.decode(serverConfig)
    }
    if (serverConfig?.trim()) {
      try {
        jsyaml.load(serverConfig)
      } catch (err) {
        errors.push(err)
      }
    }
    let agentConfig = form?.config?.['agent-config-file-content'] ?? ''
    if (needDecodeConfigKeys.includes('agent-config-file-content')) {
      agentConfig = Base64.decode(agentConfig)
    }
    if (agentConfig?.trim()) {
      try {
        jsyaml.load(agentConfig)
      } catch (err) {
        errors.push(err)
      }
    }

    if (['aws', 'alibaba', 'tencent'].includes(schema.id)) {
      const userData = form.options['user-data-content']
      if (userData && userData.length > 16 * 1024) {
        errors.push('User data length over 16KB')
      }
    }
    if (['google'].includes(schema.id)) {
      const userData = form.options['startup-script-content']
      if (userData && userData.length > 256 * 1024) {
        errors.push('Startup Script Content length over 256KB')
      }
    }

    return [...requiredErrors, ...errors]
  }

  return { getForm, validate: validateForm }
}
