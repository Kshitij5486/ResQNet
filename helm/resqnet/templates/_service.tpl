{{/*
Generic microservice deployment template
Usage: {{ include "resqnet.serviceDeployment" (dict "name" "user-service" "port" 8081 "values" .Values.userService "root" .) }}
*/}}
{{- define "resqnet.serviceDeployment" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .name }}
  namespace: {{ .root.Values.global.namespace }}
  labels:
    app: {{ .name }}
    {{- include "resqnet.labels" .root | nindent 4 }}
spec:
  replicas: {{ .values.replicas }}
  selector:
    matchLabels:
      app: {{ .name }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge:       1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: {{ .name }}
    spec:
      containers:
        - name:  {{ .name }}
          image: {{ .root.Values.global.imageRegistry }}/{{ .values.image }}:{{ .values.tag }}
          imagePullPolicy: {{ .root.Values.global.imagePullPolicy }}
          ports:
            - containerPort: {{ .values.port }}
          envFrom:
            - configMapRef:
                name: resqnet-config
            - secretRef:
                name: resqnet-secrets
          readinessProbe:
            httpGet:
              path: /actuator/health
              port: {{ .values.port }}
            initialDelaySeconds: 60
            periodSeconds:       10
          livenessProbe:
            httpGet:
              path: /actuator/health
              port: {{ .values.port }}
            initialDelaySeconds: 90
            periodSeconds:       15
          resources:
            {{- toYaml .values.resources | nindent 12 }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ .name }}
  namespace: {{ .root.Values.global.namespace }}
spec:
  selector:
    app: {{ .name }}
  ports:
    - port:       {{ .values.port }}
      targetPort: {{ .values.port }}
  type: ClusterIP
{{- if .values.hpa.enabled }}
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .name }}-hpa
  namespace: {{ .root.Values.global.namespace }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind:       Deployment
    name:       {{ .name }}
  minReplicas: {{ .values.hpa.minReplicas }}
  maxReplicas: {{ .values.hpa.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type:               Utilization
          averageUtilization: {{ .values.hpa.cpuTarget }}
{{- end }}
{{- end }}