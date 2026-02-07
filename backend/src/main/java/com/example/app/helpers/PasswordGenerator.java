package com.example.app.helpers;

import com.example.app.exception.AppException;

import java.security.SecureRandom;

import static com.example.app.exception.ErrorCode.PASSWORD_INVALID;

public final class PasswordGenerator {
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGIT = "0123456789";
    private static final String SPECIAL = "@$!%*?&";
    private static final String ALL = LOWER + UPPER + DIGIT + SPECIAL;

    private static final SecureRandom RANDOM = new SecureRandom();

    private PasswordGenerator() {
    }

    public static String generate(int length) {
        if (length < 8) {
            throw new AppException(PASSWORD_INVALID);
        }

        StringBuilder sb = new StringBuilder(length);

        sb.append(LOWER.charAt(RANDOM.nextInt(LOWER.length())));
        sb.append(UPPER.charAt(RANDOM.nextInt(UPPER.length())));
        sb.append(DIGIT.charAt(RANDOM.nextInt(DIGIT.length())));
        sb.append(SPECIAL.charAt(RANDOM.nextInt(SPECIAL.length())));

        for (int i = 4; i < length; i++) {
            sb.append(ALL.charAt(RANDOM.nextInt(ALL.length())));
        }

        return shuffle(sb.toString());
    }

    private static String shuffle(String input) {
        char[] chars = input.toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        return new String(chars);
    }
}
