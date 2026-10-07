package com.safewalk.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.safewalk.model.UserAccount;
import com.safewalk.repository.UserAccountRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserAccountRepository users;
    private final PasswordEncoder encoder;

    public DataInitializer(
            UserAccountRepository users,
            PasswordEncoder encoder
    ) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {

        if (users.count() == 0) {

            UserAccount user = new UserAccount();

            user.setPinHash(
                    encoder.encode("1234")
            );

            user.setRecoveryCodeHash(
                    encoder.encode("123456")
            );

            users.save(user);

            System.out.println();
            System.out.println("==========================================");
            System.out.println("          SAFEWALK DEMO ACCOUNT");
            System.out.println("==========================================");
            System.out.println("PIN           : 1234");
            System.out.println("Recovery Code : 123456");
            System.out.println("Admin         : 1234567890");
            System.out.println("==========================================");
            System.out.println();

        } else {

            System.out.println(
                    "SafeWalk users already exist."
            );
        }
    }
}