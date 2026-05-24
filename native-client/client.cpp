#include <iostream>
#include <string>
#include <vector>
#include <cstdio>
#include <cstdint>

#if defined(_WIN32)
#include <io.h>
#include <fcntl.h>
#endif

using namespace std;

int main() {
#if defined(_WIN32)
    _setmode(_fileno(stdin), _O_BINARY);
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    while (true) {
        uint32_t length = 0;
        cin.read(reinterpret_cast<char*>(&length), 4);
        
        if (cin.eof() || cin.fail()) {
            break;
        }

        if (length == 0) {
            continue;
        }

        vector<char> buffer(length);
        cin.read(buffer.data(), length);
        
        if (cin.eof() || cin.fail()) {
            break;
        }

        string message(buffer.begin(), buffer.end());
        string response = "{\"status\":\"success\",\"echo\":" + message + "}";
        uint32_t responseLength = response.length();

        cout.write(reinterpret_cast<const char*>(&responseLength), 4);
        cout.write(response.data(), responseLength);
        cout.flush();
    }

    return 0;
}