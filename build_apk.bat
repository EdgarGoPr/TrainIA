@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\gonzalezdeprada_e\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [1/4] Synchronizing web files to www directory...
if not exist "www" mkdir "www"
copy /Y "index.html" "www\index.html"
copy /Y "manifest.json" "www\manifest.json"
copy /Y "version.json" "www\version.json"
copy /Y "sw.js" "www\sw.js"

if not exist "www\js" mkdir "www\js"
xcopy /E /Y /I "js" "www\js"

if not exist "www\styles" mkdir "www\styles"
xcopy /E /Y /I "styles" "www\styles"

if not exist "www\icons" mkdir "www\icons"
xcopy /E /Y /I "icons" "www\icons"

echo [2/4] Running Capacitor Sync...
call npx cap sync android

echo [3/4] Compiling Android Native APK...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo Build failed with error %ERRORLEVEL%
    cd ..
    exit /b %ERRORLEVEL%
)
cd ..

echo [4/4] Copying compiled APK to root workspace...
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "TrainIA.apk"
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "www\TrainIA.apk"

echo ========================================================
echo SUCCESS: TrainIA.apk v1.1.2 built and updated in root!
echo ========================================================
