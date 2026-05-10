{{/*
Expand the name of the chart.
*/}}
{{- define "resqnet.name" -}}
{{- .Chart.Name }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "resqnet.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "resqnet.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Image name helper
*/}}
{{- define "resqnet.image" -}}
{{- printf "%s/%s:%s" .Values.global.imageRegistry .imageName .imageTag }}
{{- end }}

{{/*
Namespace
*/}}
{{- define "resqnet.namespace" -}}
{{- .Values.global.namespace }}
{{- end }}