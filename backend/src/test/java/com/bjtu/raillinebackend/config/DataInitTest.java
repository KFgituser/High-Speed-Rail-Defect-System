package com.bjtu.raillinebackend.config;

import com.bjtu.raillinebackend.entity.User;
import com.bjtu.raillinebackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class DataInitTest {

    @Test
    void doesNothingWhenInitializationIsDisabled() throws Exception {
        UserRepository users = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);

        CommandLineRunner runner = new DataInit().initializeAdministrator(users, encoder, false, "admin", "password");
        runner.run();

        verifyNoInteractions(users, encoder);
    }

    @Test
    void createsAdminOnlyWhenItDoesNotExist() throws Exception {
        UserRepository users = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(users.existsByUsername("admin")).thenReturn(false);
        when(encoder.encode("password")).thenReturn("encoded-password");

        new DataInit().initializeAdministrator(users, encoder, true, "admin", "password").run();

        verify(users).existsByUsername("admin");
        verify(encoder).encode("password");
        verify(users).save(any(User.class));
    }

    @Test
    void keepsExistingAdminUntouched() throws Exception {
        UserRepository users = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(users.existsByUsername("admin")).thenReturn(true);

        new DataInit().initializeAdministrator(users, encoder, true, "admin", "password").run();

        verify(users).existsByUsername("admin");
        verify(encoder, never()).encode(any());
        verify(users, never()).save(any());
    }
}
