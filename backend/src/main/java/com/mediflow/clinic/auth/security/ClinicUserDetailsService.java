package com.mediflow.clinic.auth.security;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.mediflow.clinic.user.entity.Permission;
import com.mediflow.clinic.user.entity.Role;
import com.mediflow.clinic.user.entity.User;
import com.mediflow.clinic.user.repository.UserRepository;

@Service
public class ClinicUserDetailsService implements UserDetailsService {

	private final UserRepository userRepository;

	public ClinicUserDetailsService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
			.orElseThrow(() -> new UsernameNotFoundException("User not found."));

		return new ClinicUserPrincipal(user);
	}

	private String normalizeEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase();
	}

	public static final class ClinicUserPrincipal implements UserDetails {

		private final User user;
		private final Set<GrantedAuthority> authorities;

		private ClinicUserPrincipal(User user) {
			this.user = user;
			this.authorities = resolveAuthorities(user);
		}

		public User getUser() {
			return user;
		}

		@Override
		public Collection<? extends GrantedAuthority> getAuthorities() {
			return authorities;
		}

		@Override
		public String getPassword() {
			return user.getPasswordHash();
		}

		@Override
		public String getUsername() {
			return user.getEmail();
		}

		@Override
		public boolean isAccountNonExpired() {
			return user.isAccountNonExpired();
		}

		@Override
		public boolean isAccountNonLocked() {
			return user.isAccountNonLocked();
		}

		@Override
		public boolean isCredentialsNonExpired() {
			return user.isCredentialsNonExpired();
		}

		@Override
		public boolean isEnabled() {
			return user.isEnabled();
		}

		private static Set<GrantedAuthority> resolveAuthorities(User user) {
			Set<GrantedAuthority> resolved = new LinkedHashSet<>();
			for (Role role : user.getRoles()) {
				resolved.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
				for (Permission permission : role.getPermissions()) {
					resolved.add(new SimpleGrantedAuthority(permission.getCode()));
				}
			}
			return resolved;
		}
	}
}
