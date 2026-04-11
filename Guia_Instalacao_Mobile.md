# 🛠️ Guia de Instalação: Ambiente Android Nativo

Para que o **My Daily Hub** funcione perfeitamente com notificações fora do app (background) e alarmes sonoros, você precisará gerar o APK usando as versões corretas das ferramentas de desenvolvedor.

---

## 1. Instalar o Java Correto (JDK 17)
Detectamos que você tem o Java 24. O Android Studio e o Capacitor ainda não são 100% estávies com o Java 24. Precisamos do **Java 17**.

1.  Acesse o site [Adoptium (Temurin 17)](https://adoptium.net/temurin/releases/?version=17).
2.  Baixe o instalador `.msi` para **Windows x64**.
3.  Execute o instalador. **IMPORTANTE**: Durante a instalação, marque as opções:
    *   `Add to PATH`
    *   `Set JAVA_HOME variable`
4.  Após instalar, reinicie o computador (ou o terminal).

## 2. Instalar o Android Studio
1.  Baixe o [Android Studio (Ladybug ou Koala)](https://developer.android.com/studio).
2.  Instale com as opções padrão.
3.  Ao abrir pela primeira vez, ele pedirá para baixar o **SDK**. Aceite tudo.
4.  No Android Studio, vá em `Settings > Languages & Frameworks > Android SDK`:
    *   Na aba `SDK Platforms`, verifique se o **Android 15 (VanillaIceCream / API 35)** está marcado.
    *   Na aba `SDK Tools`, verifique se o **Android SDK Build-Tools** e **Android SDK Command-line Tools** estão marcados.

## 3. Rodar o App no Celular
Com o Java 17 e o Android Studio instalados:

1.  Conecte seu celular ao PC via USB (ative o "Depuração USB" nas opções de desenvolvedor do celular).
2.  No VS Code (ou terminal), rode:
    ```powershell
    npx cap run android
    ```
    Isso vai compilar e instalar o app direto no seu celular!

## 4. Gerar o APK Final
Se quiser apenas o arquivo `.apk`:
1.  Abra o Android Studio.
2.  Vá em `Open` e selecione a pasta `android` dentro do seu projeto.
3.  Espere o Gradle carregar (pode demorar alguns minutos na primeira vez).
4.  Vá no menu superior: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
5.  Quando terminar, aparecerá um balão no canto inferior direito com um link `locate`. Clique nele para achar seu arquivo `app-debug.apk`.

---

> [!TIP]
> **Por que tudo isso?**
> Notificações agendadas (como o aviso de 5 minutos antes da agenda) precisam de permissões especiais do sistema Android que só funcionam 100% quando o app é instalado como um aplicativo nativo real (.apk), e não apenas rodando no navegador.
