package com.safewalk.config;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import com.safewalk.model.UserAccount;
import com.safewalk.repository.UserAccountRepository;
@Component
public class DataInitializer implements CommandLineRunner {
  private final UserAccountRepository users; private final PasswordEncoder encoder;
  public DataInitializer(UserAccountRepository users,PasswordEncoder encoder){this.users=users;this.encoder=encoder;}
  @Override public void run(String... args){
    if(users.count()==0) users.save(new UserAccount(encoder.encode("1234"),encoder.encode("123456")));
  }
}
