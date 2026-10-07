@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\gonzalezdeprada_e\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo Build failed with error %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

echo Build succeeded!
